/**
 * WEEKLY RUNNER LOCK SERVICE
 *
 * Distributed locking for weekly runs to prevent concurrent execution.
 *
 * Lock acquisition uses an atomic INSERT … ON CONFLICT … RETURNING pattern
 * so that concurrent callers never both believe they hold the lock.
 *
 * The wildcard-vs-org-specific overlap is handled by checking for an active
 * wildcard lock (weekStart:*:*:mode) before accepting an org-scoped run.
 */

import { query, getClient } from '@/db/client';
import { WEEKLY_LOCKS_SCHEMA_SQL } from './schema';

// ============================================================================
// Types
// ============================================================================

export interface LockResult {
    acquired: boolean;
    lockKey: string;
    runId?: string;
    existingRunId?: string;
    reason?: string;
}

// ============================================================================
// Schema Enforcement
// ============================================================================

let schemaEnsured = false;

async function ensureLockSchema(): Promise<void> {
    if (schemaEnsured) return;
    try {
        await query(WEEKLY_LOCKS_SCHEMA_SQL);
        schemaEnsured = true;
    } catch (e) {
        // Do NOT set schemaEnsured=true on error — let the next call retry.
        throw e;
    }
}

// ============================================================================
// Lock Operations
// ============================================================================

/**
 * Build lock key from run parameters.
 */
export function buildLockKey(params: {
    weekStart: string;
    orgId?: string;
    teamId?: string;
    mode: string;
}): string {
    return `${params.weekStart}:${params.orgId || '*'}:${params.teamId || '*'}:${params.mode}`;
}

/**
 * Build an adaptive TTL in minutes based on team count.
 * Minimum 10 min, maximum 60 min.
 */
export function computeLockTtlMinutes(teamCount: number): number {
    return Math.max(10, Math.min(60, Math.ceil(teamCount * 0.75)));
}

/**
 * Try to acquire a lock atomically. Returns false if already locked.
 *
 * Uses a single-statement INSERT … ON CONFLICT … RETURNING to avoid the
 * SELECT → INSERT race condition present in the original two-step approach.
 * The RETURNING clause only returns the row if we were the caller that wrote
 * our run_id — if another process concurrently wins the upsert, RETURNING
 * yields their run_id and we correctly detect the conflict.
 *
 * Also checks for an active wildcard lock that would overlap an org-scoped run
 * (e.g. a global `weekStart:*:*:FULL` run started before an org-specific one).
 */
export async function acquireLock(params: {
    lockKey: string;
    runId: string;
    ttlMinutes?: number;
}): Promise<LockResult> {
    try {
        await ensureLockSchema();
    } catch {
        // Schema creation failed — allow the run to proceed without locking
        // rather than hard-blocking. Log and continue.
        console.warn('[Lock] Schema ensure failed; proceeding without lock.');
        return { acquired: true, lockKey: params.lockKey, runId: params.runId };
    }

    const ttlMinutes = params.ttlMinutes ?? 30;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Parse week prefix and mode for overlap check
    const parts = params.lockKey.split(':');
    const weekPrefix = parts[0]; // e.g. '2025-01-06'
    const orgSegment = parts[1]; // org UUID or '*'
    const modeSegment = parts[3]; // 'FULL' etc.

    // If this is an org-specific run, check that no active wildcard run exists
    // for the same week+mode (which would process this org redundantly).
    if (orgSegment && orgSegment !== '*') {
        const wildcardKey = `${weekPrefix}:*:*:${modeSegment}`;
        const wildcardRes = await query(
            `SELECT run_id FROM weekly_locks
             WHERE lock_key = $1 AND status = 'ACTIVE' AND expires_at > NOW()`,
            [wildcardKey]
        );
        if (wildcardRes.rows.length > 0) {
            return {
                acquired: false,
                lockKey: params.lockKey,
                existingRunId: wildcardRes.rows[0].run_id,
                reason: 'GLOBAL_RUN_IN_PROGRESS',
            };
        }
    }

    const client = await getClient();
    try {
        // Atomic CAS: upsert only when the existing row is not ACTIVE (or expired).
        // RETURNING run_id lets us detect whether our run_id was actually written.
        const result = await client.query<{ run_id: string }>(
            `INSERT INTO weekly_locks (lock_key, run_id, expires_at, status)
             VALUES ($1, $2, $3, 'ACTIVE')
             ON CONFLICT (lock_key) DO UPDATE
               SET run_id      = EXCLUDED.run_id,
                   acquired_at = NOW(),
                   expires_at  = EXCLUDED.expires_at,
                   status      = 'ACTIVE'
               WHERE weekly_locks.status != 'ACTIVE'
                  OR weekly_locks.expires_at <= NOW()
             RETURNING run_id`,
            [params.lockKey, params.runId, expiresAt]
        );

        if (result.rows.length > 0 && result.rows[0].run_id === params.runId) {
            // We wrote our run_id — we hold the lock.
            return { acquired: true, lockKey: params.lockKey, runId: params.runId };
        }

        // RETURNING returned nothing (conflict WHERE was false) or returned a
        // different run_id — another active run holds this lock.
        const existing = await client.query<{ run_id: string }>(
            `SELECT run_id FROM weekly_locks WHERE lock_key = $1`,
            [params.lockKey]
        );
        return {
            acquired: false,
            lockKey: params.lockKey,
            existingRunId: existing.rows[0]?.run_id,
            reason: 'ALREADY_LOCKED',
        };
    } catch (e: any) {
        return {
            acquired: false,
            lockKey: params.lockKey,
            reason: `LOCK_ERROR: ${e.message}`,
        };
    } finally {
        client.release();
    }
}

/**
 * Release a lock.
 */
export async function releaseLock(params: {
    lockKey: string;
    runId: string;
    status: 'COMPLETED' | 'FAILED';
}): Promise<void> {
    await query(
        `UPDATE weekly_locks SET status = $3
         WHERE lock_key = $1 AND run_id = $2`,
        [params.lockKey, params.runId, params.status]
    );
}

/**
 * Check if a lock exists and is active.
 */
export async function checkLock(lockKey: string): Promise<{
    locked: boolean;
    runId?: string;
    acquiredAt?: Date;
    expiresAt?: Date;
}> {
    try {
        await ensureLockSchema();
    } catch {
        return { locked: false };
    }

    const result = await query(
        `SELECT run_id, acquired_at, expires_at FROM weekly_locks
         WHERE lock_key = $1 AND status = 'ACTIVE' AND expires_at > NOW()`,
        [lockKey]
    );

    if (result.rows.length === 0) {
        return { locked: false };
    }

    return {
        locked: true,
        runId: result.rows[0].run_id,
        acquiredAt: new Date(result.rows[0].acquired_at),
        expiresAt: new Date(result.rows[0].expires_at),
    };
}

/**
 * Get all active locks.
 */
export async function getActiveLocks(): Promise<Array<{
    lockKey: string;
    runId: string;
    acquiredAt: Date;
    expiresAt: Date;
}>> {
    try {
        await ensureLockSchema();
    } catch {
        return [];
    }

    const result = await query(
        `SELECT lock_key, run_id, acquired_at, expires_at FROM weekly_locks
         WHERE status = 'ACTIVE' AND expires_at > NOW()
         ORDER BY acquired_at DESC`
    );

    return result.rows.map(r => ({
        lockKey: r.lock_key,
        runId: r.run_id,
        acquiredAt: new Date(r.acquired_at),
        expiresAt: new Date(r.expires_at),
    }));
}

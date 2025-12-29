/**
 * WEEKLY RUNNER LOCK SERVICE
 * 
 * Distributed locking for weekly runs to prevent concurrent execution.
 */

import { query } from '@/db/client';
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
        schemaEnsured = true;
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
 * Try to acquire a lock. Returns false if already locked.
 */
export async function acquireLock(params: {
    lockKey: string;
    runId: string;
    ttlMinutes?: number;
}): Promise<LockResult> {
    await ensureLockSchema();

    const ttlMinutes = params.ttlMinutes ?? 30;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Check for existing active lock
    const existing = await query(
        `SELECT run_id, status, expires_at FROM weekly_locks 
         WHERE lock_key = $1 AND status = 'ACTIVE' AND expires_at > NOW()`,
        [params.lockKey]
    );

    if (existing.rows.length > 0) {
        return {
            acquired: false,
            lockKey: params.lockKey,
            existingRunId: existing.rows[0].run_id,
            reason: 'ALREADY_LOCKED',
        };
    }

    // Try to acquire (upsert to handle expired locks)
    try {
        await query(
            `INSERT INTO weekly_locks (lock_key, run_id, expires_at, status)
             VALUES ($1, $2, $3, 'ACTIVE')
             ON CONFLICT (lock_key) DO UPDATE SET
                run_id = $2,
                acquired_at = NOW(),
                expires_at = $3,
                status = 'ACTIVE'
             WHERE weekly_locks.status != 'ACTIVE' OR weekly_locks.expires_at <= NOW()`,
            [params.lockKey, params.runId, expiresAt]
        );

        // Verify we got the lock
        const verify = await query(
            `SELECT run_id FROM weekly_locks WHERE lock_key = $1 AND run_id = $2`,
            [params.lockKey, params.runId]
        );

        if (verify.rows.length > 0) {
            return {
                acquired: true,
                lockKey: params.lockKey,
                runId: params.runId,
            };
        }

        // Someone else got it
        return {
            acquired: false,
            lockKey: params.lockKey,
            reason: 'RACE_CONDITION',
        };
    } catch (e: any) {
        return {
            acquired: false,
            lockKey: params.lockKey,
            reason: `LOCK_ERROR: ${e.message}`,
        };
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
    await ensureLockSchema();

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
    await ensureLockSchema();

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

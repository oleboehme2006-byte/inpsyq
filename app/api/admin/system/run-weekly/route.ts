/**
 * POST /api/admin/system/run-weekly
 *
 * Admin-triggered weekly pipeline run.
 * No cron secret required — protected by ADMIN role.
 *
 * Body: { week_offset?: number, dry_run?: boolean }
 *
 * Hardening (Phase 3, Module 7):
 *   - Returns 423 Locked (with existingRunId) when a run is already in progress
 *   - Enforces MIN_RUN_INTERVAL_MINUTES before accepting a non-dry-run trigger
 *   - Sets X-Run-Id header immediately so the client can poll for status
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { runWeekly } from '@/services/weeklyRunner/runner';
import { checkLock, buildLockKey } from '@/services/weeklyRunner/lock';
import { query } from '@/db/client';
import { SECURITY_LIMITS } from '@/lib/security/limits';
import { getCanonicalWeek, getPreviousWeeks } from '@/lib/week';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RequestBody {
    week_offset?: number;
    dry_run?: boolean;
}

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // Admin guard
    const guardResult = await requireAdminStrict(req);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    const { orgId, userId } = guardResult.value;

    // Parse body
    let body: RequestBody = {};
    try {
        const text = await req.text();
        if (text) body = JSON.parse(text);
    } catch {
        return NextResponse.json(
            { ok: false, error: { code: 'INVALID_BODY', message: 'Invalid JSON body' }, request_id: requestId },
            { status: 400 }
        );
    }

    const weekOffset = body.week_offset ?? -1;
    const dryRun = body.dry_run === true;

    // Resolve target week (for lock key pre-check and throttle check)
    let resolvedWeekStart: string | undefined;
    if (weekOffset !== undefined) {
        const weeks = getPreviousWeeks(Math.abs(weekOffset) + 1);
        resolvedWeekStart = weeks[Math.abs(weekOffset)]?.weekStartStr;
    }
    const { weekStartStr } = getCanonicalWeek(new Date(), resolvedWeekStart);

    // ── Throttle check (non-dry-run only) ──────────────────────────────────────
    // Reject if a run for this org+week was started within MIN_RUN_INTERVAL_MINUTES.
    if (!dryRun) {
        const minIntervalMs = SECURITY_LIMITS.MIN_RUN_INTERVAL_MINUTES * 60 * 1000;
        const since = new Date(Date.now() - minIntervalMs).toISOString();
        try {
            const recentRes = await query(
                `SELECT event_id, created_at
                 FROM audit_events
                 WHERE org_id = $1
                   AND event_type IN ('ADMIN_RUN_WEEKLY', 'ADMIN_RUN_WEEKLY_DRYRUN')
                   AND (payload->>'week_start')::text = $2
                   AND created_at > $3::timestamptz
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [orgId, weekStartStr, since]
            );
            if (recentRes.rows.length > 0) {
                const lastRun = new Date(recentRes.rows[0].created_at);
                const waitMs = minIntervalMs - (Date.now() - lastRun.getTime());
                return NextResponse.json(
                    {
                        ok: false,
                        error: {
                            code: 'TOO_SOON',
                            message: `A run for this week was triggered ${Math.ceil((Date.now() - lastRun.getTime()) / 60000)}m ago. Wait ${Math.ceil(waitMs / 60000)}m before re-triggering.`,
                        },
                        request_id: requestId,
                    },
                    { status: 429 }
                );
            }
        } catch {
            // audit_events table may not exist — skip throttle check gracefully
        }
    }

    // ── Pre-flight lock check ──────────────────────────────────────────────────
    // Check before we even start the run to give fast 423 feedback.
    if (!dryRun) {
        const lockKey = buildLockKey({ weekStart: weekStartStr, orgId, mode: 'FULL' });
        const lockState = await checkLock(lockKey);
        if (lockState.locked) {
            return NextResponse.json(
                {
                    ok: false,
                    error: {
                        code: 'LOCKED',
                        message: 'A run for this org and week is already in progress.',
                        existingRunId: lockState.runId,
                    },
                    request_id: requestId,
                },
                {
                    status: 423,
                    headers: { 'X-Existing-Run-Id': lockState.runId ?? '' },
                }
            );
        }
    }

    console.log(`[Admin] Run weekly triggered by user ${userId}`, {
        orgId, weekOffset, dryRun,
        timestamp: new Date().toISOString(),
    });

    try {
        const result = await runWeekly({
            orgId,
            weekOffset,
            options: { dryRun, mode: 'FULL' },
        });

        const durationMs = Date.now() - startTime;

        // Audit log
        try {
            await query(
                `INSERT INTO audit_events (event_id, org_id, event_type, metadata, created_at)
                 VALUES ($1, $2, $3, $4, NOW())`,
                [
                    crypto.randomUUID(),
                    orgId,
                    dryRun ? 'ADMIN_RUN_WEEKLY_DRYRUN' : 'ADMIN_RUN_WEEKLY',
                    JSON.stringify({
                        triggered_by_user: userId,
                        week_start: result.weekStart,
                        week_offset: weekOffset,
                        dry_run: dryRun,
                        status: result.status,
                        duration_ms: durationMs,
                        counts: result.counts,
                        triggered_by: 'ADMIN_UI',
                    }),
                ]
            );
        } catch (auditError: any) {
            console.warn('[Admin] Failed to write audit event:', auditError.message);
        }

        // Already-locked case (lock acquired inside runner but lost race)
        if (result.error?.startsWith('LOCKED:')) {
            return NextResponse.json(
                { ok: false, error: { code: 'LOCKED', message: result.error }, request_id: requestId },
                { status: 423 }
            );
        }

        const apiStatus = dryRun ? 'DRY_RUN'
            : result.status === 'completed' ? 'COMPLETED'
            : result.status === 'partial'   ? 'PARTIAL'
            : 'FAILED';

        return NextResponse.json(
            {
                ok: true,
                status: apiStatus,
                weekStart: result.weekStart,
                durationMs,
                runId: result.runId,
                counts: {
                    teamsTotal:                result.counts.teamsTotal,
                    teamsSuccess:              result.counts.teamsSuccess,
                    teamsFailed:               result.counts.teamsFailed,
                    pipelineUpserts:           result.counts.pipelineUpserts,
                    interpretationGenerations: result.counts.interpretationGenerations,
                },
                error: result.error,
                request_id: requestId,
            },
            { headers: { 'X-Run-Id': result.runId } }
        );

    } catch (e: any) {
        console.error('[Admin] Run weekly failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'EXECUTION_FAILED', message: 'Weekly run failed' }, request_id: requestId },
            { status: 500 }
        );
    }
}

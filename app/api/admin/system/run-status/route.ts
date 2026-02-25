/**
 * GET /api/admin/system/run-status
 *
 * Returns the current in-flight run state for this org.
 * Reads from weekly_locks (active lock) and audit_events (recent runs).
 *
 * Intended for polling from the admin UI to show live run progress
 * without triggering a new run.
 *
 * Phase 3, Module 8 — Observability.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { getActiveLocks } from '@/services/weeklyRunner/lock';
import { query } from '@/db/client';
import { format } from 'date-fns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const requestId = crypto.randomUUID();

    const guardResult = await requireAdminStrict(req);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    const { orgId } = guardResult.value;

    try {
        // 1. Active locks for this org (or global)
        const allLocks = await getActiveLocks();
        const orgLocks = allLocks.filter(l => {
            const parts = l.lockKey.split(':');
            const lockOrgId = parts[1]; // '*' for global, uuid for org-scoped
            return lockOrgId === orgId || lockOrgId === '*';
        });

        const inFlight = orgLocks.map(l => ({
            lockKey:     l.lockKey,
            runId:       l.runId,
            acquiredAt:  l.acquiredAt.toISOString(),
            expiresAt:   l.expiresAt.toISOString(),
            elapsedMs:   Date.now() - l.acquiredAt.getTime(),
        }));

        // 2. Recent run history (last 5)
        let recentRuns: any[] = [];
        try {
            const auditRes = await query(
                `SELECT event_id, event_type, payload, created_at
                 FROM audit_events
                 WHERE org_id = $1
                   AND event_type IN ('ADMIN_RUN_WEEKLY', 'ADMIN_RUN_WEEKLY_DRYRUN', 'WEEKLY_RUN_COMPLETE', 'WEEKLY_RUN_FAILED')
                 ORDER BY created_at DESC
                 LIMIT 5`,
                [orgId]
            );
            recentRuns = auditRes.rows.map(r => ({
                runId:      r.event_id,
                eventType:  r.event_type,
                weekStart:  r.payload?.week_start ?? null,
                status:     r.payload?.status ?? null,
                durationMs: r.payload?.duration_ms ?? null,
                counts:     r.payload?.counts ?? null,
                triggeredAt: r.created_at
                    ? format(new Date(r.created_at), 'MMM d, yyyy HH:mm:ss')
                    : null,
            }));
        } catch {
            // audit_events may not exist
        }

        return NextResponse.json({
            ok: true,
            isRunning: inFlight.length > 0,
            inFlight,
            recentRuns,
            request_id: requestId,
        });

    } catch (e: any) {
        console.error('[Admin] run-status failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch run status' }, request_id: requestId },
            { status: 500 }
        );
    }
}

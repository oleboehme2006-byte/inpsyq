/**
 * GET /api/internal/health/weekly
 * 
 * Health check endpoint for weekly automation.
 * Returns run statistics and current lock state.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';
import { getActiveLocks } from '@/services/weeklyRunner/lock';
import { getCanonicalWeek } from '@/lib/week';

const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;

export async function GET(request: NextRequest) {
    // Validate admin secret
    const providedSecret = request.headers.get('x-inpsyq-admin-secret');

    if (!ADMIN_SECRET || !providedSecret || providedSecret !== ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { weekStartStr, weekLabel } = getCanonicalWeek();

        // Get last successful run
        const lastSuccess = await query(
            `SELECT run_id, week_start, finished_at, duration_ms 
             FROM weekly_runs 
             WHERE status = 'completed' 
             ORDER BY finished_at DESC LIMIT 1`
        );

        // Get last failed run
        const lastFailed = await query(
            `SELECT run_id, week_start, finished_at, error 
             FROM weekly_runs 
             WHERE status IN ('failed', 'partial') 
             ORDER BY finished_at DESC LIMIT 1`
        );

        // Get last run (any status)
        const lastRun = await query(
            `SELECT run_id, week_start, status, finished_at, duration_ms 
             FROM weekly_runs 
             ORDER BY started_at DESC LIMIT 1`
        );

        // Count consecutive failures
        const recentRuns = await query(
            `SELECT status FROM weekly_runs 
             ORDER BY started_at DESC LIMIT 10`
        );

        let consecutiveFailures = 0;
        for (const row of recentRuns.rows) {
            if (row.status === 'completed') break;
            if (row.status === 'failed' || row.status === 'partial') {
                consecutiveFailures++;
            }
        }

        // Check coverage for current week
        const currentWeekRun = await query(
            `SELECT status, teams_total, teams_success, teams_failed 
             FROM weekly_runs 
             WHERE week_start = $1 AND status = 'completed'
             ORDER BY finished_at DESC LIMIT 1`,
            [weekStartStr]
        );

        let coverageStatus: 'OK' | 'PARTIAL' | 'STALE' | 'NONE' = 'NONE';
        if (currentWeekRun.rows.length > 0) {
            const row = currentWeekRun.rows[0];
            if (row.teams_failed === 0) {
                coverageStatus = 'OK';
            } else {
                coverageStatus = 'PARTIAL';
            }
        } else if (lastSuccess.rows.length > 0) {
            // Has runs but not for current week
            coverageStatus = 'STALE';
        }

        // Get active locks
        const activeLocks = await getActiveLocks();

        return NextResponse.json({
            current_week: weekStartStr,
            current_week_label: weekLabel,

            last_run: lastRun.rows[0] ? {
                run_id: lastRun.rows[0].run_id,
                week_start: lastRun.rows[0].week_start?.toISOString().slice(0, 10),
                status: lastRun.rows[0].status,
                finished_at: lastRun.rows[0].finished_at?.toISOString(),
                duration_ms: lastRun.rows[0].duration_ms,
            } : null,

            last_success_at: lastSuccess.rows[0]?.finished_at?.toISOString() || null,
            last_failed_at: lastFailed.rows[0]?.finished_at?.toISOString() || null,
            last_error: lastFailed.rows[0]?.error || null,

            consecutive_failures: consecutiveFailures,
            coverage_status: coverageStatus,

            current_locks: activeLocks.map(l => ({
                lock_key: l.lockKey,
                run_id: l.runId,
                acquired_at: l.acquiredAt.toISOString(),
                expires_at: l.expiresAt.toISOString(),
            })),

            healthy: coverageStatus === 'OK' && consecutiveFailures === 0 && activeLocks.length === 0,
        });
    } catch (error: any) {
        console.error('[health/weekly]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

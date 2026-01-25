/**
 * GET /api/admin/system/weekly
 * 
 * Returns weekly run history for the organization.
 * ADMIN only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { query } from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const requestId = crypto.randomUUID();

    // Admin guard
    const guardResult = await requireAdminStrict(req);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    const { orgId } = guardResult.value;

    // Get limit from query params
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

    try {
        // Query weekly_runs table if it exists, otherwise query audit_events
        let runs: any[] = [];

        // Try weekly_runs table first
        try {
            const result = await query(`
                SELECT 
                    run_id,
                    week_start,
                    status,
                    started_at,
                    finished_at,
                    error_message,
                    teams_processed,
                    teams_failed
                FROM weekly_runs
                WHERE org_id = $1
                ORDER BY started_at DESC
                LIMIT $2
            `, [orgId, limit]);
            runs = result.rows;
        } catch (tableError: any) {
            // weekly_runs table might not exist, try audit_events
            if (tableError.message.includes('does not exist')) {
                const auditResult = await query(`
                    SELECT 
                        event_id as run_id,
                        created_at as started_at,
                        created_at as finished_at,
                        event_type,
                        payload
                    FROM audit_events
                    WHERE org_id = $1 
                    AND event_type LIKE 'WEEKLY_RUN%'
                    ORDER BY created_at DESC
                    LIMIT $2
                `, [orgId, limit]);

                runs = auditResult.rows.map(row => ({
                    run_id: row.run_id,
                    week_start: row.payload?.week_start || null,
                    status: row.event_type.includes('FAILED') ? 'FAILED' :
                        row.event_type.includes('COMPLETED') ? 'COMPLETED' : 'UNKNOWN',
                    started_at: row.started_at,
                    finished_at: row.finished_at,
                    error_message: row.payload?.error || null,
                    teams_processed: row.payload?.teams_processed || null,
                    teams_failed: row.payload?.teams_failed || null,
                }));
            } else {
                throw tableError;
            }
        }

        return NextResponse.json({
            ok: true,
            runs: runs.map(row => ({
                runId: row.run_id,
                weekStart: row.week_start,
                status: row.status,
                startedAt: row.started_at,
                finishedAt: row.finished_at,
                errorMessage: row.error_message,
                teamsProcessed: row.teams_processed,
                teamsFailed: row.teams_failed,
            })),
            request_id: requestId,
        });
    } catch (e: any) {
        console.error('[Admin] GET /system/weekly failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch weekly runs' }, request_id: requestId },
            { status: 500 }
        );
    }
}

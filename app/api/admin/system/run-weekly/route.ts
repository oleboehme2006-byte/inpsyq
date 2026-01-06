/**
 * POST /api/admin/system/run-weekly
 * 
 * Admin-triggered weekly pipeline run.
 * No cron secret required - protected by ADMIN role.
 * 
 * Body: { week_offset?: number, dry_run?: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { runWeekly } from '@/services/weeklyRunner/runner';
import { query } from '@/db/client';

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
        if (text) {
            body = JSON.parse(text);
        }
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: { code: 'INVALID_BODY', message: 'Invalid JSON body' }, request_id: requestId },
            { status: 400 }
        );
    }

    const weekOffset = body.week_offset ?? -1; // Default to last completed week
    const dryRun = body.dry_run === true;

    console.log(`[Admin] Run weekly triggered by user ${userId}`, {
        orgId,
        weekOffset,
        dryRun,
        timestamp: new Date().toISOString(),
    });

    try {
        // Run the weekly pipeline for this org only
        const result = await runWeekly({
            orgId,
            weekOffset,
            options: { dryRun, mode: 'FULL' },
        });

        const durationMs = Date.now() - startTime;

        // Audit log
        try {
            await query(`
                INSERT INTO audit_events (
                    event_id, org_id, user_id, event_type, payload, created_at
                ) VALUES ($1, $2, $3, $4, $5, NOW())
            `, [
                crypto.randomUUID(),
                orgId,
                userId,
                dryRun ? 'ADMIN_RUN_WEEKLY_DRYRUN' : 'ADMIN_RUN_WEEKLY',
                JSON.stringify({
                    week_start: result.weekStart,
                    week_offset: weekOffset,
                    dry_run: dryRun,
                    status: result.status,
                    duration_ms: durationMs,
                    counts: result.counts,
                    triggered_by: 'ADMIN_UI',
                }),
            ]);
        } catch (auditError: any) {
            console.warn('[Admin] Failed to write audit event:', auditError.message);
        }

        // Handle locked state
        if (result.error?.startsWith('LOCKED:')) {
            return NextResponse.json({
                ok: false,
                error: { code: 'LOCKED', message: result.error },
                request_id: requestId,
            }, { status: 409 });
        }

        return NextResponse.json({
            ok: true,
            result: {
                status: dryRun ? 'DRY_RUN' :
                    result.status === 'completed' ? 'COMPLETED' :
                        result.status === 'partial' ? 'PARTIAL' : 'FAILED',
                weekStart: result.weekStart,
                durationMs,
                runId: result.runId,
                counts: {
                    teamsTotal: result.counts.teamsTotal,
                    teamsSuccess: result.counts.teamsSuccess,
                    teamsFailed: result.counts.teamsFailed,
                    pipelineUpserts: result.counts.pipelineUpserts,
                    interpretationGenerations: result.counts.interpretationGenerations,
                },
                error: result.error,
            },
            request_id: requestId,
        });

    } catch (e: any) {
        console.error('[Admin] Run weekly failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'EXECUTION_FAILED', message: 'Weekly run failed' }, request_id: requestId },
            { status: 500 }
        );
    }
}

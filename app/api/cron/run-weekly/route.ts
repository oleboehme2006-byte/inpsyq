/**
 * POST /api/cron/run-weekly
 *
 * Vercel Cron endpoint for the weekly automation pipeline.
 * This path matches the middleware's public route matcher (/api/cron/.*) so
 * it is never redirected to /login regardless of Clerk session state.
 *
 * Auth: Vercel sends "Authorization: Bearer <CRON_SECRET>" where CRON_SECRET
 * is the value set in the Vercel project's environment variables. This endpoint
 * validates that header before delegating to the shared pipeline runner.
 *
 * Schedule (vercel.json): 0 2 * * 1  — every Monday at 02:00 UTC
 */

import { NextRequest, NextResponse } from 'next/server';
import { runWeekly } from '@/services/weeklyRunner/runner';
import { measure } from '@/lib/diagnostics/timing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
    // Vercel cron authentication: "Authorization: Bearer <CRON_SECRET>"
    if (!CRON_SECRET) {
        console.error('[cron/run-weekly] CRON_SECRET env var is not set — rejecting all cron requests');
        return NextResponse.json(
            { error: 'Server misconfiguration', code: 'SECRET_NOT_CONFIGURED' },
            { status: 500 }
        );
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json(
            { error: 'Unauthorized', code: 'INVALID_SECRET' },
            { status: 401 }
        );
    }

    console.log('[cron/run-weekly] Cron triggered', {
        timestamp: new Date().toISOString(),
        source: 'vercel-cron',
    });

    try {
        const result = await measure('cronRunWeekly', () =>
            runWeekly({ options: { dryRun: false, mode: 'FULL' } })
        );

        if (result.error?.startsWith('LOCKED:')) {
            console.log('[cron/run-weekly] Locked — another run in progress', { runId: result.runId });
            return NextResponse.json({
                success: false,
                run_id: result.runId,
                week_start: result.weekStart,
                status: 'LOCKED',
                message: result.error,
            }, { status: 409 });
        }

        console.log('[cron/run-weekly] Completed', {
            runId: result.runId,
            status: result.status,
            durationMs: result.durationMs,
            orgsTotal: result.counts.orgsTotal,
            teamsTotal: result.counts.teamsTotal,
        });

        return NextResponse.json({
            success: true,
            run_id: result.runId,
            week_start: result.weekStart,
            week_label: result.weekLabel,
            status: result.status === 'completed' ? 'COMPLETED'
                : result.status === 'partial' ? 'PARTIAL' : 'FAILED',
            duration_ms: result.durationMs,
            counts: {
                orgs_total: result.counts.orgsTotal,
                orgs_success: result.counts.orgsSuccess,
                orgs_failed: result.counts.orgsFailed,
                teams_total: result.counts.teamsTotal,
                teams_success: result.counts.teamsSuccess,
                teams_failed: result.counts.teamsFailed,
                pipeline_upserts: result.counts.pipelineUpserts,
                pipeline_skips: result.counts.pipelineSkips,
                interpretation_generations: result.counts.interpretationGenerations,
                interpretation_cache_hits: result.counts.interpretationCacheHits,
            },
            error: result.error ?? null,
        });
    } catch (error: any) {
        console.error('[cron/run-weekly] Uncaught error', { message: error.message });
        return NextResponse.json(
            { success: false, error: error.message, code: 'EXECUTION_FAILED' },
            { status: 500 }
        );
    }
}

// Vercel cron only ever sends POST; reject anything else
export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

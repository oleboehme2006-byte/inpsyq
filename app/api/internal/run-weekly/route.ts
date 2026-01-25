/**
 * POST /api/internal/run-weekly
 * 
 * Secure cron-compatible endpoint for triggering weekly automation.
 * Requires INTERNAL_CRON_SECRET header.
 * 
 * Supports:
 * - week_start or week_offset for targeting specific weeks
 * - mode: FULL | PIPELINE_ONLY | INTERPRETATION_ONLY
 * - org_id and team_id for scoped execution
 * - dry_run for safe testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { runWeekly } from '@/services/weeklyRunner/runner';
import { RunMode } from '@/services/weeklyRunner/types';
import { measure } from '@/lib/diagnostics/timing';

const CRON_SECRET = process.env.INTERNAL_CRON_SECRET;
export const dynamic = 'force-dynamic';

interface RequestBody {
    week_start?: string;
    week_offset?: number;
    org_id?: string;
    team_id?: string;
    mode?: RunMode;
    dry_run?: boolean;
}

export async function POST(request: NextRequest) {
    // Validate cron secret
    const providedSecret = request.headers.get('x-cron-secret');

    if (!CRON_SECRET) {
        console.error('[run-weekly] INTERNAL_CRON_SECRET not configured');
        return NextResponse.json(
            { error: 'Server misconfiguration', code: 'SECRET_NOT_CONFIGURED' },
            { status: 500 }
        );
    }

    if (!providedSecret || providedSecret !== CRON_SECRET) {
        return NextResponse.json(
            { error: 'Unauthorized', code: 'INVALID_SECRET' },
            { status: 401 }
        );
    }

    // Parse body
    let body: RequestBody = {};
    try {
        const text = await request.text();
        if (text) {
            body = JSON.parse(text);
        }
    } catch (e: any) {
        return NextResponse.json(
            { error: 'Invalid JSON body', code: 'INVALID_BODY' },
            { status: 400 }
        );
    }

    // Validate mode
    const validModes: RunMode[] = ['FULL', 'PIPELINE_ONLY', 'INTERPRETATION_ONLY'];
    if (body.mode && !validModes.includes(body.mode)) {
        return NextResponse.json(
            { error: `Invalid mode. Must be one of: ${validModes.join(', ')}`, code: 'INVALID_MODE' },
            { status: 400 }
        );
    }

    const orgId = body.org_id;
    const teamId = body.team_id;
    const weekStart = body.week_start;
    const weekOffset = body.week_offset;
    const mode = body.mode || 'FULL';
    const dryRun = body.dry_run === true;

    // Log the request
    console.log(`[run-weekly] Starting weekly run`, {
        orgId: orgId || 'all',
        teamId: teamId || 'all',
        weekStart: weekStart || `offset:${weekOffset ?? 0}`,
        mode,
        dryRun,
        timestamp: new Date().toISOString(),
    });

    try {
        const result = await measure('runWeekly', () => runWeekly({
            orgId,
            teamId,
            weekStart,
            weekOffset,
            options: { dryRun, mode },
        }));

        // Check if we got locked out
        if (result.error?.startsWith('LOCKED:')) {
            console.log(`[run-weekly] Locked`, { runId: result.runId });
            return NextResponse.json({
                success: false,
                run_id: result.runId,
                week_start: result.weekStart,
                status: 'LOCKED',
                message: result.error,
            }, { status: 409 });
        }

        console.log(`[run-weekly] Completed`, {
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
            scope: {
                org_id: orgId || null,
                team_id: teamId || null,
            },
            mode,
            dry_run: dryRun,
            status: result.status === 'completed' ? 'COMPLETED' :
                result.status === 'partial' ? 'PARTIAL' : 'FAILED',
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
            error: result.error,
        });
    } catch (error: any) {
        console.error('[run-weekly] Failed', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                code: 'EXECUTION_FAILED',
            },
            { status: 500 }
        );
    }
}

// Reject other methods
export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

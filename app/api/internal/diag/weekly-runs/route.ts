/**
 * GET /api/internal/diag/weekly-runs
 * 
 * Diagnostics API for weekly runs.
 * Lists runs, inspects run details, checks readiness.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRunsByWeek, getRunById, getLatestRuns } from '@/services/weeklyRunner/audit';
import { getCanonicalWeek } from '@/lib/week';
import { query } from '@/db/client';

const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // Validate admin secret
    const providedSecret = request.headers.get('x-inpsyq-admin-secret');

    if (!ADMIN_SECRET || !providedSecret || providedSecret !== ADMIN_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const runId = searchParams.get('run_id');
    const weekStart = searchParams.get('week_start');
    const orgId = searchParams.get('org_id');
    const teamId = searchParams.get('team_id');

    try {
        switch (action) {
            case 'list': {
                // List runs
                const runs = weekStart
                    ? await getRunsByWeek(weekStart)
                    : await getLatestRuns(20);

                return NextResponse.json({
                    runs: runs.map(r => ({
                        run_id: r.runId,
                        week_start: r.weekStart,
                        week_label: r.weekLabel,
                        scope: r.scope,
                        status: r.status,
                        started_at: r.startedAt.toISOString(),
                        finished_at: r.finishedAt?.toISOString(),
                        duration_ms: r.durationMs,
                        counts: r.counts,
                    })),
                });
            }

            case 'detail': {
                if (!runId) {
                    return NextResponse.json({ error: 'run_id required' }, { status: 400 });
                }

                const run = await getRunById(runId);
                if (!run) {
                    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
                }

                return NextResponse.json({
                    run_id: run.runId,
                    week_start: run.weekStart,
                    week_label: run.weekLabel,
                    scope: run.scope,
                    scope_id: run.scopeId,
                    status: run.status,
                    started_at: run.startedAt.toISOString(),
                    finished_at: run.finishedAt?.toISOString(),
                    duration_ms: run.durationMs,
                    counts: run.counts,
                    error: run.error,
                    details: run.details,
                });
            }

            case 'readiness': {
                // Check if org/team has weekly product and interpretation
                const { weekStartStr, weekLabel } = getCanonicalWeek();

                if (orgId && teamId) {
                    // Team readiness
                    const product = await query(
                        `SELECT week_start, input_hash FROM org_aggregates_weekly 
                         WHERE org_id = $1 AND team_id = $2 
                         ORDER BY week_start DESC LIMIT 1`,
                        [orgId, teamId]
                    );

                    const interp = await query(
                        `SELECT week_start, input_hash FROM weekly_interpretations 
                         WHERE org_id = $1 AND team_id = $2 AND is_active = true
                         ORDER BY week_start DESC LIMIT 1`,
                        [orgId, teamId]
                    );

                    return NextResponse.json({
                        org_id: orgId,
                        team_id: teamId,
                        current_week: weekStartStr,
                        current_week_label: weekLabel,
                        has_product: product.rows.length > 0,
                        latest_product_week: product.rows[0]?.week_start?.toISOString().slice(0, 10),
                        has_interpretation: interp.rows.length > 0,
                        latest_interpretation_week: interp.rows[0]?.week_start?.toISOString().slice(0, 10),
                    });
                } else if (orgId) {
                    // Org readiness
                    const teams = await query(
                        `SELECT team_id FROM teams WHERE org_id = $1`,
                        [orgId]
                    );

                    const products = await query(
                        `SELECT COUNT(DISTINCT team_id) as count FROM org_aggregates_weekly WHERE org_id = $1`,
                        [orgId]
                    );

                    return NextResponse.json({
                        org_id: orgId,
                        current_week: weekStartStr,
                        total_teams: teams.rows.length,
                        teams_with_products: parseInt(products.rows[0]?.count || '0'),
                    });
                } else {
                    // Overall readiness
                    const orgs = await query(`SELECT COUNT(*) as count FROM orgs`);
                    const teams = await query(`SELECT COUNT(*) as count FROM teams`);
                    const products = await query(`SELECT COUNT(DISTINCT (org_id, team_id)) as count FROM org_aggregates_weekly`);

                    return NextResponse.json({
                        current_week: weekStartStr,
                        current_week_label: weekLabel,
                        total_orgs: parseInt(orgs.rows[0]?.count || '0'),
                        total_teams: parseInt(teams.rows[0]?.count || '0'),
                        teams_with_products: parseInt(products.rows[0]?.count || '0'),
                    });
                }
            }

            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('[diag/weekly-runs]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

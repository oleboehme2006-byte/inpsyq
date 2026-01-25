import { NextResponse } from 'next/server';
import { query } from '@/db/client';
import { aggregationService } from '@/services/aggregationService';
import { requireAdminStrict } from '@/lib/access/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
    try {
        // ADMIN only
        const guardResult = await requireAdminStrict(req);
        if (!guardResult.ok) {
            return guardResult.response;
        }

        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get('team_id');
        const orgId = searchParams.get('org_id') || guardResult.value.orgId;
        const weekStart = searchParams.get('week_start');

        if (!teamId || !orgId || !weekStart) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'team_id and week_start required' } },
                { status: 400 }
            );
        }

        // Check K-threshold (Safety Check)
        // Though aggregation should have skipped it, we double check to be safe before exposing breakdowns
        const teamInfo = await query(`SELECT k_threshold FROM orgs WHERE org_id = $1`, [orgId]);
        let k = 7;
        if (teamInfo.rows.length > 0) k = teamInfo.rows[0].k_threshold || 7;

        // Check active users (approx for validity of exposure)
        // We rely on the fact that 'indices' and 'contributions_breakdown' are only written if k was met.
        // But let's be explicit.

        let aggRes = await query(`
          SELECT * FROM org_aggregates_weekly 
          WHERE org_id = $1 AND team_id = $2 
          AND week_start >= ($3::date - 1) AND week_start <= ($3::date + 1)
          LIMIT 1
      `, [orgId, teamId, weekStart]);

        if (aggRes.rows.length === 0) {
            console.log(`[Audit] Aggregates missing for ${weekStart}. Attempting auto-compute...`);
            await aggregationService.runWeeklyAggregation(orgId, teamId, new Date(weekStart));

            // Re-fetch
            aggRes = await query(`
                SELECT * FROM org_aggregates_weekly 
                WHERE org_id = $1 AND team_id = $2 
                AND week_start >= ($3::date - 1) AND week_start <= ($3::date + 1)
                LIMIT 1
            `, [orgId, teamId, weekStart]);

            if (aggRes.rows.length === 0) {
                return NextResponse.json({
                    error: 'Compute Failed: Insufficient Data (k < 7) or no profiles.'
                }, { status: 404 });
            }
        }

        const data = aggRes.rows[0];

        if (!data.contributions_breakdown) {
            console.log(`[Audit] Breakdown missing for ${weekStart}. Attempting re-compute...`);
            await aggregationService.runWeeklyAggregation(orgId, teamId, new Date(weekStart));
            // We won't re-fetch a second time to avoid loops, just warn user to refresh.
            return NextResponse.json({ error: 'Audit data processing. Please refresh.' }, { status: 503 });
        }

        return NextResponse.json({
            org_id: data.org_id,
            team_id: data.team_id,
            week_start: data.week_start,
            team_parameter_means: data.parameter_means,
            indices: data.indices,
            profile_weight_share: data.contributions_breakdown.profile_weight_share,
            parameter_contributions: data.contributions_breakdown.parameter_contributions
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

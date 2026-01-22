import { NextResponse } from 'next/server';
import { briefingService } from '@/services/llm/briefs';
import { decisionService } from '@/services/decision/decisionService';
import { query } from '@/db/client';
import { requireAdminStrict } from '@/lib/access/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

        // 1. Fetch Decision Snapshot (The heavy lifter)
        const snapshot = await decisionService.analyzeTeam(orgId, teamId, weekStart);

        // 2. Fetch Weekly Indices (History)
        const weeklyRes = await query(`
            SELECT week_start, indices 
            FROM org_aggregates_weekly 
            WHERE org_id = $1 AND team_id = $2
            ORDER BY week_start DESC 
            LIMIT 9
        `, [orgId, teamId]);

        // 3. Fetch Profiles (Current)
        const profilesRes = await query(`
            SELECT profile_type, activation_score, confidence
            FROM org_profiles_weekly
            WHERE org_id = $1 AND team_id = $2 AND week_start = $3
        `, [orgId, teamId, snapshot.meta.week_start.slice(0, 10)]);

        // 4. Fetch Audit/Breakdown (Current) - Simplified fetch
        // (Assuming data exists or DecisionService would have failed/warned)
        const auditRes = await query(`
            SELECT contributions_breakdown
            FROM org_aggregates_weekly
            WHERE org_id = $1 AND team_id = $2 AND week_start = $3
        `, [orgId, teamId, snapshot.meta.week_start.slice(0, 10)]);
        const contributions = auditRes.rows[0]?.contributions_breakdown || {};

        // 5. Generate Brief
        const brief = await briefingService.generateTeamleadBrief({
            org_id: orgId,
            team_id: teamId,
            week_start: weekStart,
            snapshot,
            history: weeklyRes.rows.reverse(), // Ascending order
            profiles: profilesRes.rows,
            contributions
        });

        return NextResponse.json(brief);

    } catch (error) {
        console.error('[API/Brief] Error:', error);
        return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
    }
}

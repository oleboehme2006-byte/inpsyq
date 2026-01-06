/**
 * GET /api/admin/setup/status
 * 
 * Returns the onboarding wizard status for the selected org.
 * Checks all required steps for a functional org.
 * ADMIN only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { query } from '@/db/client';
import { getOrgHealthSnapshot } from '@/services/ops/healthSnapshot';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type StepStatus = 'OK' | 'AT_RISK' | 'CRITICAL';

interface StepResult {
    status: StepStatus;
    [key: string]: any;
}

interface SetupStatusResponse {
    ok: true;
    orgId: string;
    orgName: string;
    targetWeekStart: string;
    steps: {
        orgSelected: StepResult;
        teams: StepResult;
        access: StepResult;
        pipeline: StepResult;
        dashboards: StepResult;
    };
}

export async function GET(req: NextRequest) {
    const requestId = crypto.randomUUID();

    // Admin guard - also resolves org from context
    const guardResult = await requireAdminStrict(req);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    const { orgId, userId } = guardResult.value;

    try {
        // Get org name
        const orgRes = await query('SELECT name FROM orgs WHERE org_id = $1', [orgId]);
        const orgName = orgRes.rows[0]?.name || 'Unknown Org';

        // Get health snapshot (week_offset=-1 for last completed week)
        const snapshot = await getOrgHealthSnapshot(orgId, -1);
        const targetWeekStart = snapshot.weekStart;

        // Step A: Org Selected
        const orgSelected: StepResult = {
            status: 'OK',
            orgId,
            orgName,
        };

        // Step B: Teams exist (at least 1 active team)
        const teamsRes = await query(
            `SELECT COUNT(*) as count FROM teams WHERE org_id = $1 AND (is_archived = false OR is_archived IS NULL)`,
            [orgId]
        );
        const activeTeamCount = parseInt(teamsRes.rows[0].count || '0', 10);
        const teams: StepResult = {
            status: activeTeamCount >= 1 ? 'OK' : 'CRITICAL',
            activeCount: activeTeamCount,
        };

        // Step C: Access configured (members or invites exist)
        const membersRes = await query(
            `SELECT COUNT(*) as count FROM memberships WHERE org_id = $1 AND user_id != $2`,
            [orgId, userId]
        );
        const memberCount = parseInt(membersRes.rows[0].count || '0', 10);

        const invitesRes = await query(
            `SELECT COUNT(*) as count FROM active_invites WHERE org_id = $1 AND expires_at > NOW()`,
            [orgId]
        );
        const inviteCount = parseInt(invitesRes.rows[0].count || '0', 10);

        // Check email provider status
        const emailEnabled = process.env.EMAIL_PROVIDER !== 'disabled' && !!process.env.RESEND_API_KEY;

        let accessStatus: StepStatus = 'OK';
        let accessNote: string | undefined;

        if (memberCount === 0 && inviteCount === 0) {
            if (!emailEnabled) {
                accessStatus = 'AT_RISK';
                accessNote = 'Invites require email provider. You can still add members later after enabling email.';
            } else {
                accessStatus = 'CRITICAL';
            }
        }

        const access: StepResult = {
            status: accessStatus,
            memberCount,
            inviteCount,
            emailEnabled,
            note: accessNote,
        };

        // Step D: Pipeline produced data for last completed week
        const hasProducts = snapshot.teamsWithProducts > 0;
        const hasInterpretations = snapshot.teamsWithInterpretation > 0;

        // Check if weekly run exists for this week
        let hasWeeklyRun = false;
        try {
            const runRes = await query(
                `SELECT COUNT(*) as count FROM audit_events 
                 WHERE org_id = $1 
                 AND event_type LIKE 'WEEKLY_RUN%'
                 AND payload->>'week_start' = $2`,
                [orgId, targetWeekStart]
            );
            hasWeeklyRun = parseInt(runRes.rows[0].count || '0', 10) > 0;
        } catch {
            // audit_events might not have this structure
        }

        let pipelineStatus: StepStatus = 'OK';
        if (snapshot.teamsTotal === 0) {
            pipelineStatus = 'AT_RISK'; // No teams to produce data for
        } else if (snapshot.teamsFailed > 0 || !hasProducts) {
            pipelineStatus = 'CRITICAL';
        } else if (snapshot.teamsDegraded > 0 || !hasInterpretations) {
            pipelineStatus = 'AT_RISK';
        }

        const pipeline: StepResult = {
            status: pipelineStatus,
            hasWeeklyRun,
            okTeamsCount: snapshot.teamsOk,
            missingTeamsCount: snapshot.teamsFailed,
            degradedTeamsCount: snapshot.teamsDegraded,
            hasProducts,
            hasInterpretations,
        };

        // Step E: Dashboards healthy
        let executiveOk = false;
        let sampleTeamId: string | null = null;
        let sampleTeamOk = false;

        // Check executive dashboard - it needs teams with products
        if (snapshot.teamsWithProducts > 0) {
            executiveOk = true;
        }

        // Get a sample team with data
        if (snapshot.teamsTotal > 0) {
            const sampleTeamRes = await query(
                `SELECT t.team_id FROM teams t 
                 JOIN org_aggregates_weekly a ON t.team_id = a.team_id 
                 WHERE t.org_id = $1 AND a.week_start = $2
                 LIMIT 1`,
                [orgId, targetWeekStart]
            );
            if (sampleTeamRes.rows.length > 0) {
                sampleTeamId = sampleTeamRes.rows[0].team_id;
                sampleTeamOk = true;
            } else {
                // Get any team
                const anyTeamRes = await query(
                    `SELECT team_id FROM teams WHERE org_id = $1 LIMIT 1`,
                    [orgId]
                );
                if (anyTeamRes.rows.length > 0) {
                    sampleTeamId = anyTeamRes.rows[0].team_id;
                }
            }
        }

        let dashboardStatus: StepStatus = 'OK';
        if (!executiveOk && snapshot.teamsTotal > 0) {
            dashboardStatus = 'CRITICAL';
        } else if (!sampleTeamOk && snapshot.teamsTotal > 0) {
            dashboardStatus = 'AT_RISK';
        } else if (snapshot.teamsTotal === 0) {
            dashboardStatus = 'AT_RISK';
        }

        const dashboards: StepResult = {
            status: dashboardStatus,
            executiveOk,
            teamsCount: snapshot.teamsTotal,
            sampleTeamOk,
            sampleTeamId,
        };

        const response: SetupStatusResponse = {
            ok: true,
            orgId,
            orgName,
            targetWeekStart,
            steps: {
                orgSelected,
                teams,
                access,
                pipeline,
                dashboards,
            },
        };

        return NextResponse.json(response);

    } catch (e: any) {
        console.error('[Admin] GET /setup/status failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch setup status' }, request_id: requestId },
            { status: 500 }
        );
    }
}

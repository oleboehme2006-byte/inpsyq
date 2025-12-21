import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';
import { generateRequestId, isValidUUID } from '@/lib/api/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/internal/diag/team-stats
 * Dev-only diagnostic endpoint to verify data persistence.
 * 
 * Returns actual database counts for org/team.
 */
export async function GET(req: NextRequest) {
    const requestId = generateRequestId();

    // Dev-only
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Dev only', code: 'PROD_BLOCKED' }, { status: 403 });
    }

    const url = new URL(req.url);
    const orgId = url.searchParams.get('org_id');
    const teamId = url.searchParams.get('team_id');

    if (!orgId || !isValidUUID(orgId)) {
        return NextResponse.json({ error: 'Invalid org_id', request_id: requestId }, { status: 400 });
    }
    if (!teamId || !isValidUUID(teamId)) {
        return NextResponse.json({ error: 'Invalid team_id', request_id: requestId }, { status: 400 });
    }

    try {
        // Check org exists
        const orgRes = await query(`SELECT org_id, name FROM orgs WHERE org_id = $1`, [orgId]);
        const orgExists = orgRes.rows.length > 0;
        const orgName = orgRes.rows[0]?.name || null;

        // Check team exists
        const teamRes = await query(`SELECT team_id, name, org_id FROM teams WHERE team_id = $1`, [teamId]);
        const teamExists = teamRes.rows.length > 0;
        const teamName = teamRes.rows[0]?.name || null;
        const teamOrgId = teamRes.rows[0]?.org_id || null;

        // Count users in team
        const usersRes = await query(`
            SELECT COUNT(*) as count FROM users 
            WHERE org_id = $1 AND team_id = $2
        `, [orgId, teamId]);
        const usersCount = parseInt(usersRes.rows[0]?.count || '0');

        // Count sessions for users in team
        const sessionsRes = await query(`
            SELECT COUNT(*) as count FROM sessions s
            JOIN users u ON s.user_id = u.user_id
            WHERE u.org_id = $1 AND u.team_id = $2
        `, [orgId, teamId]);
        const sessionsCount = parseInt(sessionsRes.rows[0]?.count || '0');

        // Count responses for users in team
        const responsesRes = await query(`
            SELECT COUNT(*) as count FROM responses r
            JOIN sessions s ON r.session_id = s.session_id
            JOIN users u ON s.user_id = u.user_id
            WHERE u.org_id = $1 AND u.team_id = $2
        `, [orgId, teamId]);
        const responsesCount = parseInt(responsesRes.rows[0]?.count || '0');

        // Count latent states for users in team
        const latentRes = await query(`
            SELECT COUNT(*) as count FROM latent_states ls
            JOIN users u ON ls.user_id = u.user_id
            WHERE u.org_id = $1 AND u.team_id = $2
        `, [orgId, teamId]);
        const latentStatesCount = parseInt(latentRes.rows[0]?.count || '0');

        // Count aggregates (weekly)
        const aggregatesRes = await query(`
            SELECT COUNT(*) as count FROM org_aggregates_weekly
            WHERE org_id = $1 AND team_id = $2
        `, [orgId, teamId]);
        const aggregatesCount = parseInt(aggregatesRes.rows[0]?.count || '0');

        // Last session
        const lastSessionRes = await query(`
            SELECT s.completed_at FROM sessions s
            JOIN users u ON s.user_id = u.user_id
            WHERE u.org_id = $1 AND u.team_id = $2
            ORDER BY s.completed_at DESC NULLS LAST
            LIMIT 1
        `, [orgId, teamId]);
        const lastSessionAt = lastSessionRes.rows[0]?.completed_at || null;

        return NextResponse.json({
            request_id: requestId,
            org: {
                exists: orgExists,
                org_id: orgId,
                name: orgName,
            },
            team: {
                exists: teamExists,
                team_id: teamId,
                name: teamName,
                org_id: teamOrgId,
                org_match: teamOrgId === orgId,
            },
            counts: {
                users: usersCount,
                sessions: sessionsCount,
                responses: responsesCount,
                latent_states: latentStatesCount,
                aggregates: aggregatesCount,
            },
            last_session_at: lastSessionAt,
            diagnosis: getDiagnosis({
                orgExists,
                teamExists,
                teamOrgId,
                orgId,
                usersCount,
                sessionsCount,
                responsesCount,
                latentStatesCount,
            }),
        });

    } catch (error: any) {
        console.error('[DiagTeamStats] Error:', error.message);
        return NextResponse.json({
            error: 'Query failed',
            code: 'DB_ERROR',
            details: error.message,
            request_id: requestId,
        }, { status: 500 });
    }
}

function getDiagnosis(d: {
    orgExists: boolean;
    teamExists: boolean;
    teamOrgId: string | null;
    orgId: string;
    usersCount: number;
    sessionsCount: number;
    responsesCount: number;
    latentStatesCount: number;
}): string[] {
    const issues: string[] = [];

    if (!d.orgExists) issues.push('ORG_NOT_FOUND: org_id does not exist in orgs table');
    if (!d.teamExists) issues.push('TEAM_NOT_FOUND: team_id does not exist in teams table');
    if (d.teamOrgId && d.teamOrgId !== d.orgId) issues.push('ORG_MISMATCH: team.org_id does not match provided org_id');
    if (d.usersCount === 0) issues.push('NO_USERS: no users in this org+team combination');
    if (d.sessionsCount === 0) issues.push('NO_SESSIONS: no sessions recorded for team users');
    if (d.responsesCount === 0 && d.sessionsCount > 0) issues.push('NO_RESPONSES: sessions exist but no responses');
    if (d.latentStatesCount === 0 && d.responsesCount > 0) issues.push('NO_LATENT_STATES: responses exist but no latent states (inference not running?)');

    if (issues.length === 0) issues.push('OK: data pipeline appears healthy');

    return issues;
}

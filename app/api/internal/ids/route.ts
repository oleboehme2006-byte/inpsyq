import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';
import { generateRequestId, isValidUUID } from '@/lib/api/validation';
import { DEV_ORG_ID, DEV_TEAM_ID, DEV_USER_ID, DEV_TEAMS, DEV_USERS } from '@/lib/dev/fixtures';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IdsResponse {
    orgId: string;
    teamId: string;
    userId: string;
    allTeams?: { id: string; name: string }[];
    allUsers?: { id: string; name: string; teamId: string }[];
    counts: {
        orgs: number;
        teams: number;
        users: number;
    };
    source: 'fixtures' | 'db';
    request_id: string;
}

/**
 * GET /api/internal/ids
 * Returns stable dev IDs from fixtures, with fallback to DB.
 * 
 * Query params:
 *   ?full=true  - Include all teams and users
 * 
 * Production: requires x-inpsyq-admin-secret header
 * Development: open access
 */
export async function GET(req: NextRequest) {
    const requestId = generateRequestId();

    // Production gating
    if (process.env.NODE_ENV === 'production') {
        const secret = req.headers.get('x-inpsyq-admin-secret');
        const expectedSecret = process.env.INTERNAL_ADMIN_SECRET;

        if (!expectedSecret || secret !== expectedSecret) {
            return NextResponse.json({
                error: 'Unauthorized',
                code: 'UNAUTHORIZED',
                request_id: requestId,
            }, { status: 403 });
        }
    }

    const url = new URL(req.url);
    const includeFull = url.searchParams.get('full') === 'true';

    try {
        // Get counts from DB
        const [orgsRes, teamsRes, usersRes] = await Promise.all([
            query('SELECT COUNT(*) as count FROM orgs'),
            query('SELECT COUNT(*) as count FROM teams'),
            query('SELECT COUNT(*) as count FROM users'),
        ]);

        const orgCount = parseInt(orgsRes.rows[0]?.count || '0');
        const teamCount = parseInt(teamsRes.rows[0]?.count || '0');
        const userCount = parseInt(usersRes.rows[0]?.count || '0');

        // Return stable fixtures (preferred for dev)
        const response: IdsResponse = {
            orgId: DEV_ORG_ID,
            teamId: DEV_TEAM_ID,
            userId: DEV_USER_ID,
            counts: {
                orgs: orgCount,
                teams: teamCount,
                users: userCount,
            },
            source: 'fixtures',
            request_id: requestId,
        };

        if (includeFull) {
            response.allTeams = DEV_TEAMS.map(t => ({ id: t.id, name: t.name }));
            response.allUsers = DEV_USERS.map(u => ({ id: u.id, name: u.name, teamId: u.teamId }));
        }

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('[API] /internal/ids Error:', error.message);
        return NextResponse.json({
            error: 'Database error',
            code: 'DB_ERROR',
            details: error.message,
            request_id: requestId,
        }, { status: 500 });
    }
}

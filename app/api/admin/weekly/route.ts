import { NextResponse } from 'next/server';
import { query } from '@/db/client';
import { requireOrgAccess, requireRole } from '@/lib/access/guards';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get('team_id'); // snake_case from spec
        const orgId = searchParams.get('org_id');
        const weekStart = searchParams.get('week_start');

        // Require org access if orgId provided
        if (orgId) {
            const guardResult = await requireOrgAccess(req, orgId);
            if (!guardResult.ok) {
                return guardResult.response;
            }
        }

        let q = `SELECT * FROM org_aggregates_weekly WHERE 1=1`;
        const params = [];
        let idx = 1;

        if (teamId) {
            q += ` AND team_id = $${idx++}`;
            params.push(teamId);
        }
        if (orgId) {
            q += ` AND org_id = $${idx++}`;
            params.push(orgId);
        }
        if (weekStart) {
            q += ` AND week_start = $${idx++}`;
            params.push(weekStart);
        }

        q += ` ORDER BY week_start ASC`;

        const result = await query(q, params);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

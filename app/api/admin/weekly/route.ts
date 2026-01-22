import { NextResponse } from 'next/server';
import { query } from '@/db/client';
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

import { NextResponse } from 'next/server';
import { query } from '@/db/client';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get('team_id');
        const orgId = searchParams.get('org_id');

        if (!teamId && !orgId) {
            return NextResponse.json({ error: 'Org ID or Team ID required' }, { status: 400 });
        }

        let q = `
        SELECT u.user_id, u.team_id, u.is_active, 
               ep.confidence as latest_confidence, ep.week_start as last_update
        FROM users u
        LEFT JOIN LATERAL (
            SELECT confidence, week_start 
            FROM employee_profiles ep 
            WHERE ep.user_id = u.user_id 
            ORDER BY week_start DESC 
            LIMIT 1
        ) ep ON true
        WHERE 1=1
      `;

        const params = [];
        let idx = 1;

        if (teamId) {
            q += ` AND u.team_id = $${idx++}`;
            params.push(teamId);
        }
        if (orgId) {
            q += ` AND u.org_id = $${idx++}`;
            params.push(orgId);
        }

        q += ` ORDER BY u.created_at DESC`;

        const result = await query(q, params);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

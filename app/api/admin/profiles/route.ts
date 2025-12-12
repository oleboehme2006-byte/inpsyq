import { NextResponse } from 'next/server';
import { query } from '@/db/client';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get('teamId');

        const result = await query(`
        SELECT * FROM org_profiles_weekly
        WHERE team_id = $1
        ORDER BY week_start DESC
      `, [teamId]);

        return NextResponse.json(result.rows);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

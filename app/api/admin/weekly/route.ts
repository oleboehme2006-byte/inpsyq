import { NextResponse } from 'next/server';
import { query } from '@/db/client';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get('teamId');

        // In a real app we'd filter by week, org, etc. 
        // Minimal implementation: Get latent mean of all users in team (Real-time view)
        // OR get the 'org_aggregates_weekly' table. 
        // Let's return the aggregates table data for chart.

        const result = await query(`
        SELECT * FROM org_aggregates_weekly 
        WHERE team_id = $1
        ORDER BY week_start ASC
      `, [teamId]);

        return NextResponse.json(result.rows);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

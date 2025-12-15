import { NextRequest, NextResponse } from 'next/server';
import { decisionService } from '@/services/decision/decisionService';

export const dynamic = 'force-dynamic'; // Ensure no static generation issues

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('org_id');
        const teamId = searchParams.get('team_id');
        const weekStart = searchParams.get('week_start');

        if (!orgId || !teamId || !weekStart) {
            return NextResponse.json(
                { error: 'Missing required parameters: org_id, team_id, week_start' },
                { status: 400 }
            );
        }

        const snapshot = await decisionService.analyzeTeam(orgId, teamId, weekStart);
        return NextResponse.json(snapshot);

    } catch (error: any) {
        console.error('[API] Decision Service Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

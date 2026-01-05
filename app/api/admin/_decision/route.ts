import { NextRequest, NextResponse } from 'next/server';
import { decisionService } from '@/services/decision/decisionService';
import { requireAdminStrict } from '@/lib/access/guards';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // ADMIN only
        const guardResult = await requireAdminStrict(request);
        if (!guardResult.ok) {
            return guardResult.response;
        }

        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('org_id') || guardResult.value.orgId;
        const teamId = searchParams.get('team_id');
        const weekStart = searchParams.get('week_start');

        if (!orgId || !teamId || !weekStart) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'team_id and week_start required' } },
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

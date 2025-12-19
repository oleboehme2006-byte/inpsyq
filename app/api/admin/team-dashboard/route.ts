import { NextRequest, NextResponse } from 'next/server';
import { isValidUUID, generateRequestId, createValidationError } from '@/lib/api/validation';
import { requestLogger } from '@/lib/api/requestLogger';
import { buildTeamDashboardDTO } from '@/lib/dashboard/builder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/team-dashboard?org_id=xxx&team_id=xxx&week_start=xxx
 * Returns TeamDashboardDTO for decision-grade dashboard rendering.
 */
export async function GET(req: NextRequest) {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
        const orgId = req.nextUrl.searchParams.get('org_id');
        const teamId = req.nextUrl.searchParams.get('team_id');
        const weekStart = req.nextUrl.searchParams.get('week_start') || undefined;

        // Validate UUIDs
        if (!isValidUUID(orgId)) {
            return NextResponse.json(
                createValidationError('org_id', 'org_id must be a valid UUID', requestId),
                { status: 400 }
            );
        }

        if (!isValidUUID(teamId)) {
            return NextResponse.json(
                createValidationError('team_id', 'team_id must be a valid UUID', requestId),
                { status: 400 }
            );
        }

        // Build DTO
        const dto = await buildTeamDashboardDTO({
            orgId,
            teamId,
            weekStart,
            requestId,
        });

        const duration = Date.now() - startTime;

        // Log request
        requestLogger.log({
            request_id: requestId,
            route: '/api/admin/team-dashboard',
            method: 'GET',
            duration_ms: duration,
            status: 200,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json(dto);

    } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error('[API] /admin/team-dashboard Failed:', error.message);

        requestLogger.log({
            request_id: requestId,
            route: '/api/admin/team-dashboard',
            method: 'GET',
            duration_ms: duration,
            status: 500,
            llm_error: error.message,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            error: 'Internal Server Error',
            code: 'INTERNAL_ERROR',
            request_id: requestId,
        }, { status: 500 });
    }
}

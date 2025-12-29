/**
 * TEAM INTERPRETATION API — Get Weekly Interpretation for Team
 * 
 * GET /api/interpretation/team?org_id=...&team_id=...&week_start=YYYY-MM-DD
 * Guard: TEAMLEAD or higher
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateTeamInterpretation } from '@/services/interpretation/service';
import { requireTeamAccess } from '@/lib/access/guards';
import { measure } from '@/lib/diagnostics/timing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
        const url = new URL(req.url);
        const orgId = url.searchParams.get('org_id');
        const teamId = url.searchParams.get('team_id');
        const weekStart = url.searchParams.get('week_start') || undefined;

        // Validate params
        if (!orgId || !teamId) {
            return NextResponse.json(
                { error: 'org_id and team_id are required', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        // Validate week_start format if provided
        if (weekStart && !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
            return NextResponse.json(
                { error: 'week_start must be YYYY-MM-DD format', code: 'INVALID_WEEK_START', request_id: requestId },
                { status: 400 }
            );
        }

        // Guard: require team access
        const guardResult = await requireTeamAccess(req, teamId);
        if (!guardResult.ok) {
            return guardResult.response;
        }

        // Get or create interpretation
        // Get or create interpretation
        const result = await measure('interpretation.team.getOrCreate', () =>
            getOrCreateTeamInterpretation(orgId, teamId, weekStart)
        );

        return NextResponse.json({
            request_id: requestId,
            cache_hit: result.cacheHit,
            generated: result.generated,
            duration_ms: Date.now() - startTime,
            interpretation: {
                org_id: result.record.orgId,
                team_id: result.record.teamId,
                week_start: result.record.weekStart,
                input_hash: result.record.inputHash,
                model_id: result.record.modelId,
                prompt_version: result.record.promptVersion,
                created_at: result.record.createdAt.toISOString(),
                sections: result.record.sectionsJson,
            },
        });

    } catch (error: any) {
        console.error('[API] /interpretation/team failed:', error.message);

        if (error.message.startsWith('NO_WEEKLY_PRODUCT')) {
            return NextResponse.json(
                { error: 'No weekly product data available', code: 'NO_WEEKLY_PRODUCT', request_id: requestId },
                { status: 404 }
            );
        }

        if (error.name === 'InterpretationValidationError') {
            return NextResponse.json(
                {
                    error: error.message,
                    code: 'INTERPRETATION_VALIDATION_FAILED',
                    details: error.details,
                    request_id: requestId
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

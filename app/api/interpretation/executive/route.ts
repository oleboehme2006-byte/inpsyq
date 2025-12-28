/**
 * EXECUTIVE INTERPRETATION API — Get Weekly Interpretation for Org
 * 
 * GET /api/interpretation/executive?org_id=...&week_start=YYYY-MM-DD
 * Guard: EXECUTIVE or ADMIN
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateOrgInterpretation } from '@/services/interpretation/service';
import { requireRole } from '@/lib/access/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
        const url = new URL(req.url);
        const orgId = url.searchParams.get('org_id');
        const weekStart = url.searchParams.get('week_start') || undefined;

        // Validate params
        if (!orgId) {
            return NextResponse.json(
                { error: 'org_id is required', code: 'VALIDATION_ERROR', request_id: requestId },
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

        // Guard: require EXECUTIVE or ADMIN
        const guardResult = await requireRole(req, orgId, ['ADMIN', 'EXECUTIVE']);
        if (!guardResult.ok) {
            return guardResult.response;
        }

        // Get or create interpretation
        const result = await getOrCreateOrgInterpretation(orgId, weekStart);

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
        console.error('[API] /interpretation/executive failed:', error.message);

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

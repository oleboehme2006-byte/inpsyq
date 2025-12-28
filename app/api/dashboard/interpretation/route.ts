/**
 * Dashboard Interpretation API
 * 
 * Endpoint for fetching cached or generating new interpretations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { weeklyInterpretationService, type InterpretationContext } from '@/services/llm/weeklyInterpretation';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as InterpretationContext;

        // Validate required fields
        if (!body.entityType || !body.entityId || !body.weekStart) {
            return NextResponse.json(
                { error: 'Missing required fields: entityType, entityId, weekStart' },
                { status: 400 }
            );
        }

        let interpretation;

        if (body.entityType === 'team') {
            interpretation = await weeklyInterpretationService.getTeamInterpretation(body);
        } else if (body.entityType === 'organization') {
            interpretation = await weeklyInterpretationService.getOrgInterpretation(body);
        } else {
            return NextResponse.json(
                { error: 'Invalid entityType. Must be "team" or "organization"' },
                { status: 400 }
            );
        }

        return NextResponse.json(interpretation);
    } catch (error) {
        console.error('[API] Interpretation generation failed:', error);
        return NextResponse.json(
            { error: 'Failed to generate interpretation' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { error: 'Use POST with InterpretationContext body' },
        { status: 405 }
    );
}

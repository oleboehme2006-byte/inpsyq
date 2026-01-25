/**
 * MEASUREMENT SUBMIT — Submit Responses
 * 
 * POST /api/measurement/submit
 * Guard: Session owner (employee)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, completeSession, startSession } from '@/lib/measurement/session';
import { submitBatchResponses, ResponseSubmission, getAnsweredItemIds } from '@/lib/measurement/response';
import { computeSessionQuality } from '@/lib/measurement/quality';
import { getRequiredItems, getAllItemIds } from '@/lib/measurement/itemRegistry';
import { getAuthenticatedUser } from '@/lib/access/guards';
import { query } from '@/db/client';
import { MEASUREMENT_SCHEMA_SQL } from '@/lib/measurement/schema';

export const runtime = 'nodejs';

let schemaEnsured = false;
async function ensureSchema() {
    if (schemaEnsured) return;
    try {
        await query(MEASUREMENT_SCHEMA_SQL);
        schemaEnsured = true;
    } catch (e) {
        schemaEnsured = true;
    }
}

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();

    try {
        await ensureSchema();

        const body = await req.json();
        const { sessionId, responses, complete = false } = body;

        if (!sessionId) {
            return NextResponse.json(
                { error: 'sessionId is required', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        if (!responses || !Array.isArray(responses)) {
            return NextResponse.json(
                { error: 'responses array is required', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        // Get authenticated user
        const authResult = await getAuthenticatedUser(req);
        if (!authResult.ok) {
            return authResult.response;
        }

        const userId = authResult.value.userId;

        // Get session
        let session = await getSession(sessionId);
        if (!session) {
            return NextResponse.json(
                { error: 'Session not found', code: 'NOT_FOUND', request_id: requestId },
                { status: 404 }
            );
        }

        // Verify ownership
        if (session.userId !== userId) {
            return NextResponse.json(
                { error: 'You can only submit to your own sessions', code: 'FORBIDDEN', request_id: requestId },
                { status: 403 }
            );
        }

        // Auto-start if INVITED
        if (session.status === 'INVITED') {
            session = await startSession(sessionId, userId);
        }

        // Check if session is modifiable
        if (session.status !== 'STARTED') {
            return NextResponse.json(
                { error: `Cannot submit to ${session.status} session`, code: 'INVALID_STATE', request_id: requestId },
                { status: 400 }
            );
        }

        // Validate and submit responses
        const submissions: ResponseSubmission[] = responses.map((r: any) => ({
            itemId: r.itemId || r.item_id,
            value: r.value,
        }));

        let submitted: any[];
        try {
            submitted = await submitBatchResponses(sessionId, userId, submissions);
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message, code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        // Get current progress
        const answered = await getAnsweredItemIds(sessionId);
        const requiredItems = getRequiredItems();
        const allRequired = requiredItems.every(item => answered.includes(item.itemId));

        // Complete if requested and all required answered
        let finalStatus: string = session.status;
        if (complete && allRequired) {
            const completed = await completeSession(sessionId);
            finalStatus = completed.status;

            // Compute quality metrics
            await computeSessionQuality(sessionId);
        }

        return NextResponse.json({
            request_id: requestId,
            session_id: sessionId,
            status: finalStatus,
            submitted_count: submitted.length,
            answered_count: answered.length,
            required_count: requiredItems.length,
            all_required_answered: allRequired,
        });

    } catch (error: any) {
        console.error('[API] /measurement/submit failed:', error.message);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';

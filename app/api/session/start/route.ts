import { NextResponse } from 'next/server';
import { interactionEngine } from '@/services/interactionEngine';
import { isValidUUID, generateRequestId, createValidationError } from '@/lib/api/validation';
import { requestLogger } from '@/lib/api/requestLogger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
        const body = await req.json();
        const { userId, config } = body;

        // Strict UUID Validation
        if (!isValidUUID(userId)) {
            const duration = Date.now() - startTime;
            requestLogger.log({
                request_id: requestId,
                route: '/api/session/start',
                method: 'POST',
                duration_ms: duration,
                status: 400,
                user_id: typeof userId === 'string' ? userId.slice(0, 36) : 'invalid',
                timestamp: new Date().toISOString(),
            });

            return NextResponse.json(
                createValidationError('userId', 'userId must be a valid UUID', requestId),
                { status: 400 }
            );
        }

        // Build Session
        const sessionData = await interactionEngine.buildSession(userId, config);
        const duration = Date.now() - startTime;

        // Always include meta (B4 requirement)
        const meta = sessionData.meta || {};
        const response = {
            sessionId: sessionData.sessionId,
            interactions: sessionData.interactions,
            meta: {
                ...meta,
                request_id: requestId,
                duration_ms: duration,
            },
            // Legacy fields
            llm_used: sessionData.llm_used,
            question_count: sessionData.question_count,
        };

        // Log success
        requestLogger.log({
            request_id: requestId,
            route: '/api/session/start',
            method: 'POST',
            duration_ms: duration,
            status: 200,
            user_id: userId,
            session_id: sessionData.sessionId,
            llm_used: meta.is_llm ?? sessionData.llm_used,
            item_count: sessionData.interactions.length,
            padded: meta.padded,
            llm_error: meta.llm_error,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json(response);

    } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error('[API] /session/start Failed:', error.message, error.stack);

        requestLogger.log({
            request_id: requestId,
            route: '/api/session/start',
            method: 'POST',
            duration_ms: duration,
            status: 500,
            llm_error: error.message,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            error: 'Internal Server Error',
            code: 'INTERNAL_ERROR',
            request_id: requestId,
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
        }, { status: 500 });
    }
}

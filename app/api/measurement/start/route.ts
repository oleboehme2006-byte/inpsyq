/**
 * MEASUREMENT START — Start a Measurement Session
 * 
 * POST /api/measurement/start
 * Guard: Session owner (employee)
 */

import { NextRequest, NextResponse } from 'next/server';
import { startSession, getSession } from '@/lib/measurement/session';
import { getAuthenticatedUser } from '@/lib/access/guards';
import { query } from '@/db/client';
import { MEASUREMENT_SCHEMA_SQL } from '@/lib/measurement/schema';

export const runtime = 'nodejs';

// Ensure schema exists
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
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json(
                { error: 'sessionId is required', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        // Get authenticated user
        const authResult = await getAuthenticatedUser(req);
        if (!authResult.ok) {
            return authResult.response;
        }

        const userId = authResult.value.userId;

        // Get session and verify ownership
        const session = await getSession(sessionId);
        if (!session) {
            return NextResponse.json(
                { error: 'Session not found', code: 'NOT_FOUND', request_id: requestId },
                { status: 404 }
            );
        }

        if (session.userId !== userId) {
            return NextResponse.json(
                { error: 'You can only start your own sessions', code: 'FORBIDDEN', request_id: requestId },
                { status: 403 }
            );
        }

        // Start session
        const started = await startSession(sessionId, userId);

        return NextResponse.json({
            request_id: requestId,
            session_id: started.sessionId,
            status: started.status,
            started_at: started.startedAt?.toISOString(),
        });

    } catch (error: any) {
        console.error('[API] /measurement/start failed:', error.message);

        if (error.message.includes('Cannot start')) {
            return NextResponse.json(
                { error: error.message, code: 'INVALID_STATE', request_id: requestId },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

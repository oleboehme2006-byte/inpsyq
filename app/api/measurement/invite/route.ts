/**
 * MEASUREMENT INVITE — Create Measurement Session Invite
 * 
 * POST /api/measurement/invite
 * Guard: TEAMLEAD or higher
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/measurement/session';
import { requireRole, getAuthenticatedUser } from '@/lib/access/guards';
import { weekStartISO, getISOMondayUTC } from '@/lib/aggregation/week';
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
        // Schema might already exist
        schemaEnsured = true;
    }
}

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();

    try {
        await ensureSchema();

        const body = await req.json();
        const { userId, orgId, teamId } = body;

        // Validate params
        if (!userId || !orgId) {
            return NextResponse.json(
                { error: 'userId and orgId are required', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        // Guard: require TEAMLEAD+ role
        const guardResult = await requireRole(req, orgId, ['ADMIN', 'EXECUTIVE', 'TEAMLEAD']);
        if (!guardResult.ok) {
            return guardResult.response;
        }

        // Determine week start
        const now = new Date();
        const weekStart = weekStartISO(getISOMondayUTC(now));

        // Check if user already has session for this week
        const existingResult = await query(
            `SELECT session_id FROM measurement_sessions 
       WHERE user_id = $1 AND week_start = $2`,
            [userId, weekStart]
        );

        if (existingResult.rows.length > 0) {
            return NextResponse.json(
                {
                    error: 'User already has session for this week',
                    code: 'DUPLICATE_SESSION',
                    existingSessionId: existingResult.rows[0].session_id,
                    request_id: requestId,
                },
                { status: 409 }
            );
        }

        // Create session
        const session = await createSession({
            userId,
            orgId,
            teamId: teamId || null,
            weekStart,
        });

        return NextResponse.json({
            request_id: requestId,
            session_id: session.sessionId,
            status: session.status,
            week_start: session.weekStart,
        }, { status: 201 });

    } catch (error: any) {
        console.error('[API] /measurement/invite failed:', error.message);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';

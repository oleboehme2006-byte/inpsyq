/**
 * GET /api/session/status
 * 
 * Returns the current session status for the authenticated user.
 * - hasActive: whether there's an active (incompleted) session for target week
 * - isSubmitted: whether a session was submitted for target week
 * - weekStart: the target week start date
 * - draft: if hasActive, the draft session data
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRolesStrict } from '@/lib/access/guards';
import { query } from '@/db/client';

export const dynamic = 'force-dynamic';

function getTargetWeekStart(): string {
    // Use last completed week (same as weekly runner)
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek;
    const lastMonday = new Date(now);
    lastMonday.setUTCDate(now.getUTCDate() - daysToSubtract);
    lastMonday.setUTCHours(0, 0, 0, 0);
    return lastMonday.toISOString().split('T')[0];
}

export async function GET(req: NextRequest) {
    const requestId = crypto.randomUUID();

    // Authenticate - allow all roles to check status
    const guardResult = await requireRolesStrict(req, ['EMPLOYEE', 'TEAMLEAD', 'EXECUTIVE', 'ADMIN']);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    const { userId, orgId } = guardResult.value;
    const weekStart = getTargetWeekStart();

    try {
        // Check for submitted session this week
        const submittedResult = await query(`
            SELECT session_id, completed_at
            FROM sessions
            WHERE user_id = $1 
            AND completed_at IS NOT NULL
            AND DATE_TRUNC('week', started_at) = DATE_TRUNC('week', $2::date)
            ORDER BY completed_at DESC
            LIMIT 1
        `, [userId, weekStart]);

        const isSubmitted = submittedResult.rows.length > 0;

        // Check for active (incomplete) session this week
        const activeResult = await query(`
            SELECT session_id, started_at
            FROM sessions
            WHERE user_id = $1 
            AND completed_at IS NULL
            AND DATE_TRUNC('week', started_at) = DATE_TRUNC('week', $2::date)
            ORDER BY started_at DESC
            LIMIT 1
        `, [userId, weekStart]);

        const hasActive = activeResult.rows.length > 0;

        let draft = null;
        if (hasActive) {
            const activeSessionId = activeResult.rows[0].session_id;

            // Get interactions for this session
            const interactionsResult = await query(`
                SELECT i.interaction_id, i.type, i.prompt_text
                FROM session_interactions si
                JOIN interactions i ON si.interaction_id = i.interaction_id
                WHERE si.session_id = $1
                ORDER BY si.position ASC
            `, [activeSessionId]);

            // Get existing responses
            const responsesResult = await query(`
                SELECT interaction_id, raw_input
                FROM responses
                WHERE session_id = $1
            `, [activeSessionId]);

            const responseMap = new Map();
            for (const r of responsesResult.rows) {
                responseMap.set(r.interaction_id, r.raw_input);
            }

            draft = {
                sessionId: activeSessionId,
                createdAt: activeResult.rows[0].started_at,
                interactions: interactionsResult.rows.map(i => ({
                    interactionId: i.interaction_id,
                    type: i.type,
                    promptText: i.prompt_text,
                    response: responseMap.get(i.interaction_id) || null,
                })),
            };
        }

        return NextResponse.json({
            ok: true,
            hasActive,
            isSubmitted,
            weekStart,
            draft,
            request_id: requestId,
        });

    } catch (e: any) {
        console.error('[Session] GET /status failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch session status' }, request_id: requestId },
            { status: 500 }
        );
    }
}

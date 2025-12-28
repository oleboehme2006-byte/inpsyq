/**
 * MEASUREMENT STATUS — Get Session Status
 * 
 * GET /api/measurement/status
 * Guard: Session owner (employee)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, getActiveSessionForUser } from '@/lib/measurement/session';
import { getAnsweredItemIds } from '@/lib/measurement/response';
import { getSessionQuality } from '@/lib/measurement/quality';
import { getRequiredItems, getAllItemIds, ITEM_REGISTRY } from '@/lib/measurement/itemRegistry';
import { getAuthenticatedUser } from '@/lib/access/guards';
import { query } from '@/db/client';
import { MEASUREMENT_SCHEMA_SQL } from '@/lib/measurement/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function GET(req: NextRequest) {
    const requestId = crypto.randomUUID();

    try {
        await ensureSchema();

        const url = new URL(req.url);
        const sessionId = url.searchParams.get('session_id');

        // Get authenticated user
        const authResult = await getAuthenticatedUser(req);
        if (!authResult.ok) {
            return authResult.response;
        }

        const userId = authResult.value.userId;

        // Get session (by ID or active session)
        let session;
        if (sessionId) {
            session = await getSession(sessionId);
        } else {
            session = await getActiveSessionForUser(userId);
        }

        if (!session) {
            return NextResponse.json({
                request_id: requestId,
                has_session: false,
                message: 'No active measurement session',
            });
        }

        // Verify ownership
        if (session.userId !== userId) {
            return NextResponse.json(
                { error: 'You can only view your own sessions', code: 'FORBIDDEN', request_id: requestId },
                { status: 403 }
            );
        }

        // Get progress
        const answered = await getAnsweredItemIds(session.sessionId);
        const requiredItems = getRequiredItems();
        const allItems = getAllItemIds();

        // Get quality if completed
        let quality = null;
        if (session.status === 'COMPLETED' || session.status === 'LOCKED') {
            quality = await getSessionQuality(session.sessionId);
        }

        // Build remaining items list
        const remainingItems = requiredItems
            .filter(item => !answered.includes(item.itemId))
            .map(item => ({
                itemId: item.itemId,
                label: item.label,
                scaleType: item.scaleType,
                minValue: item.minValue,
                maxValue: item.maxValue,
            }));

        return NextResponse.json({
            request_id: requestId,
            has_session: true,
            session: {
                session_id: session.sessionId,
                status: session.status,
                week_start: session.weekStart,
                invited_at: session.invitedAt.toISOString(),
                started_at: session.startedAt?.toISOString() || null,
                completed_at: session.completedAt?.toISOString() || null,
            },
            progress: {
                answered_count: answered.length,
                required_count: requiredItems.length,
                total_items: allItems.length,
                completion_percentage: Math.round((answered.length / requiredItems.length) * 100),
                all_required_answered: answered.length >= requiredItems.length,
            },
            remaining_items: remainingItems,
            quality: quality ? {
                completion_rate: quality.completionRate,
                confidence_proxy: quality.confidenceProxy,
            } : null,
        });

    } catch (error: any) {
        console.error('[API] /measurement/status failed:', error.message);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

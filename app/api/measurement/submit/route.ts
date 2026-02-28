/**
 * MEASUREMENT SUBMIT — Submit Responses
 *
 * POST /api/measurement/submit
 * Guard: Session owner (employee)
 *
 * Hardening:
 *  - Zod schema validation on every request body field
 *  - Standardized error envelope: { ok: false, error: { code, message }, request_id }
 *  - Per-user in-memory sliding-window rate limit (30 req / 60 s)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, completeSession, startSession } from '@/lib/measurement/session';
import { submitBatchResponses, ResponseSubmission, getAnsweredItemIds } from '@/lib/measurement/response';
import { computeSessionQuality } from '@/lib/measurement/quality';
import { getRequiredItems } from '@/lib/measurement/itemRegistry';
import { getAuthenticatedUser } from '@/lib/access/guards';
import { query } from '@/db/client';
import { MEASUREMENT_SCHEMA_SQL } from '@/lib/measurement/schema';
import { checkRateLimit } from '@/lib/rateLimit/submitRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Schema ──────────────────────────────────────────────────────────────────

const ResponseItemSchema = z.object({
    // Accept both camelCase and snake_case from clients
    itemId: z.string().min(1, 'itemId must be a non-empty string').optional(),
    item_id: z.string().min(1).optional(),
    value: z.number({ error: 'value must be a finite number' }).finite(),
}).refine(
    (data) => !!(data.itemId || data.item_id),
    { message: 'itemId (or item_id) is required for each response' }
);

const SubmitRequestSchema = z.object({
    sessionId: z.string().uuid('sessionId must be a valid UUID'),
    responses: z.array(ResponseItemSchema).min(1, 'responses must contain at least one item'),
    complete: z.boolean().optional().default(false),
});

// ─── Error helper ─────────────────────────────────────────────────────────────

function apiError(
    code: string,
    message: string,
    status: number,
    requestId: string
): NextResponse {
    return NextResponse.json(
        { ok: false, error: { code, message }, request_id: requestId },
        { status }
    );
}

// ─── Schema init ─────────────────────────────────────────────────────────────

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

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();

    try {
        await ensureSchema();

        // ── Authentication (before parsing body to avoid wasting work) ──────
        const authResult = await getAuthenticatedUser(req);
        if (!authResult.ok) {
            return authResult.response;
        }
        const userId = authResult.value.userId;

        // ── Rate limit ──────────────────────────────────────────────────────
        const rateLimitResult = checkRateLimit(userId);
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { ok: false, error: { code: 'RATE_LIMITED', message: `Too many requests. Retry after ${rateLimitResult.retryAfterSecs}s.` }, request_id: requestId },
                { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfterSecs) } }
            );
        }

        // ── Parse + validate body ───────────────────────────────────────────
        let rawBody: unknown;
        try {
            rawBody = await req.json();
        } catch {
            return apiError('INVALID_JSON', 'Request body must be valid JSON', 400, requestId);
        }

        const parsed = SubmitRequestSchema.safeParse(rawBody);
        if (!parsed.success) {
            const first = parsed.error.issues[0];
            return apiError(
                'VALIDATION_ERROR',
                `${first.path.join('.') || 'body'}: ${first.message}`,
                422,
                requestId
            );
        }

        const { sessionId, responses: rawResponses, complete } = parsed.data;

        // ── Session ownership check ─────────────────────────────────────────
        let session = await getSession(sessionId);
        if (!session) {
            return apiError('NOT_FOUND', 'Session not found', 404, requestId);
        }

        if (session.userId !== userId) {
            return apiError('FORBIDDEN', 'You can only submit to your own sessions', 403, requestId);
        }

        // Auto-start if INVITED
        if (session.status === 'INVITED') {
            session = await startSession(sessionId, userId);
        }

        if (session.status !== 'STARTED') {
            return apiError('INVALID_STATE', `Cannot submit to a ${session.status} session`, 400, requestId);
        }

        // ── Submit responses ────────────────────────────────────────────────
        const submissions: ResponseSubmission[] = rawResponses.map((r) => ({
            itemId: (r.itemId ?? r.item_id) as string,
            value: r.value,
        }));

        try {
            await submitBatchResponses(sessionId, userId, submissions);
        } catch (error: any) {
            return apiError('VALIDATION_ERROR', error.message, 400, requestId);
        }

        // ── Completion ──────────────────────────────────────────────────────
        const answered = await getAnsweredItemIds(sessionId);
        const requiredItems = getRequiredItems();
        const allRequired = requiredItems.every((item) => answered.includes(item.itemId));

        let finalStatus: string = session.status;
        if (complete && allRequired) {
            const completed = await completeSession(sessionId);
            finalStatus = completed.status;
            await computeSessionQuality(sessionId);
        }

        return NextResponse.json({
            ok: true,
            request_id: requestId,
            session_id: sessionId,
            status: finalStatus,
            submitted_count: submissions.length,
            answered_count: answered.length,
            required_count: requiredItems.length,
            all_required_answered: allRequired,
        });

    } catch (error: any) {
        console.error('[API] /measurement/submit failed:', error.message);
        return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500, requestId);
    }
}

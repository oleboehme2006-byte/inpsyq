/**
 * MEASUREMENT RESPONSE — Response Contract & Persistence
 * 
 * Rules:
 * - Validate against itemRegistry
 * - Enforce scale bounds
 * - One response per item per session
 * - Append-only inserts
 */

import { query } from '@/db/client';
import { getItem, validateItemValue, isValidItemId } from './itemRegistry';
import { getSession, isModifiable } from './session';

// ============================================================================
// Types
// ============================================================================

export interface MeasurementResponse {
    responseId: string;
    sessionId: string;
    userId: string;
    itemId: string;
    numericValue: number;
    createdAt: Date;
}

export interface ResponseSubmission {
    itemId: string;
    value: number;
}

// ============================================================================
// Response Operations
// ============================================================================

/**
 * Submit a single response.
 */
export async function submitResponse(
    sessionId: string,
    userId: string,
    submission: ResponseSubmission
): Promise<MeasurementResponse> {
    // Validate item exists
    if (!isValidItemId(submission.itemId)) {
        throw new Error(`[Response] Invalid item ID: "${submission.itemId}"`);
    }

    // Validate value
    validateItemValue(submission.itemId, submission.value);

    // Get session and validate ownership
    const session = await getSession(sessionId);
    if (!session) {
        throw new Error(`[Response] Session "${sessionId}" not found`);
    }

    if (session.userId !== userId) {
        throw new Error(`[Response] User mismatch: cannot submit to another user's session`);
    }

    // Check session is modifiable
    if (!isModifiable(session)) {
        throw new Error(`[Response] Session is ${session.status}: cannot modify`);
    }

    // Check for duplicate (one response per item per session)
    const existing = await query(
        `SELECT response_id FROM measurement_responses 
     WHERE session_id = $1 AND item_id = $2`,
        [sessionId, submission.itemId]
    );

    if (existing.rows.length > 0) {
        throw new Error(`[Response] Item "${submission.itemId}" already answered in this session`);
    }

    // Insert response (append-only)
    const result = await query(
        `INSERT INTO measurement_responses 
       (session_id, user_id, item_id, numeric_value, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
        [sessionId, userId, submission.itemId, submission.value]
    );

    return mapResponse(result.rows[0]);
}

/**
 * Submit multiple responses at once.
 */
export async function submitBatchResponses(
    sessionId: string,
    userId: string,
    submissions: ResponseSubmission[]
): Promise<MeasurementResponse[]> {
    const responses: MeasurementResponse[] = [];

    for (const submission of submissions) {
        const response = await submitResponse(sessionId, userId, submission);
        responses.push(response);
    }

    return responses;
}

/**
 * Get all responses for a session.
 */
export async function getSessionResponses(sessionId: string): Promise<MeasurementResponse[]> {
    const result = await query(
        `SELECT * FROM measurement_responses 
     WHERE session_id = $1
     ORDER BY created_at ASC`,
        [sessionId]
    );

    return result.rows.map(mapResponse);
}

/**
 * Get response count for a session.
 */
export async function getResponseCount(sessionId: string): Promise<number> {
    const result = await query(
        `SELECT COUNT(*) as count FROM measurement_responses WHERE session_id = $1`,
        [sessionId]
    );
    return parseInt(result.rows[0]?.count || '0');
}

/**
 * Get answered item IDs for a session.
 */
export async function getAnsweredItemIds(sessionId: string): Promise<string[]> {
    const result = await query(
        `SELECT item_id FROM measurement_responses WHERE session_id = $1`,
        [sessionId]
    );
    return result.rows.map(r => r.item_id);
}

// ============================================================================
// Helpers
// ============================================================================

function mapResponse(row: any): MeasurementResponse {
    return {
        responseId: row.response_id,
        sessionId: row.session_id,
        userId: row.user_id,
        itemId: row.item_id,
        numericValue: parseFloat(row.numeric_value),
        createdAt: new Date(row.created_at),
    };
}

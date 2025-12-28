/**
 * MEASUREMENT SESSION — Session Lifecycle Management
 * 
 * Session states: INVITED → STARTED → COMPLETED → LOCKED
 * 
 * Rules:
 * - Session created only via invite
 * - STARTED requires valid employee identity
 * - COMPLETED requires all required items answered
 * - LOCKED sessions are immutable
 * - Re-submit is forbidden
 */

import { query } from '@/db/client';
import { getRequiredItems } from './itemRegistry';

// ============================================================================
// Types
// ============================================================================

export type SessionStatus = 'INVITED' | 'STARTED' | 'COMPLETED' | 'LOCKED';

export interface MeasurementSession {
    sessionId: string;
    userId: string;
    orgId: string;
    teamId: string;
    status: SessionStatus;
    invitedAt: Date;
    startedAt: Date | null;
    completedAt: Date | null;
    lockedAt: Date | null;
    weekStart: string;
}

export interface SessionCreateParams {
    userId: string;
    orgId: string;
    teamId: string;
    weekStart: string;
}

// ============================================================================
// Session Operations
// ============================================================================

/**
 * Create a new measurement session (INVITED state).
 */
export async function createSession(params: SessionCreateParams): Promise<MeasurementSession> {
    const result = await query(
        `INSERT INTO measurement_sessions 
       (user_id, org_id, team_id, week_start, status, invited_at)
     VALUES ($1, $2, $3, $4, 'INVITED', NOW())
     RETURNING *`,
        [params.userId, params.orgId, params.teamId, params.weekStart]
    );

    return mapSession(result.rows[0]);
}

/**
 * Get session by ID.
 */
export async function getSession(sessionId: string): Promise<MeasurementSession | null> {
    const result = await query(
        `SELECT * FROM measurement_sessions WHERE session_id = $1`,
        [sessionId]
    );

    if (result.rows.length === 0) return null;
    return mapSession(result.rows[0]);
}

/**
 * Get active session for user (INVITED or STARTED).
 */
export async function getActiveSessionForUser(userId: string): Promise<MeasurementSession | null> {
    const result = await query(
        `SELECT * FROM measurement_sessions 
     WHERE user_id = $1 AND status IN ('INVITED', 'STARTED')
     ORDER BY invited_at DESC LIMIT 1`,
        [userId]
    );

    if (result.rows.length === 0) return null;
    return mapSession(result.rows[0]);
}

/**
 * Start a session (INVITED → STARTED).
 */
export async function startSession(sessionId: string, userId: string): Promise<MeasurementSession> {
    const session = await getSession(sessionId);

    if (!session) {
        throw new Error(`[Session] Session "${sessionId}" not found`);
    }

    if (session.userId !== userId) {
        throw new Error(`[Session] User mismatch: session belongs to different user`);
    }

    if (session.status !== 'INVITED') {
        throw new Error(`[Session] Cannot start session in status "${session.status}"`);
    }

    const result = await query(
        `UPDATE measurement_sessions 
     SET status = 'STARTED', started_at = NOW()
     WHERE session_id = $1
     RETURNING *`,
        [sessionId]
    );

    return mapSession(result.rows[0]);
}

/**
 * Complete a session (STARTED → COMPLETED).
 */
export async function completeSession(sessionId: string): Promise<MeasurementSession> {
    const session = await getSession(sessionId);

    if (!session) {
        throw new Error(`[Session] Session "${sessionId}" not found`);
    }

    if (session.status !== 'STARTED') {
        throw new Error(`[Session] Cannot complete session in status "${session.status}"`);
    }

    // Verify all required items answered
    const requiredItems = getRequiredItems();
    const answeredResult = await query(
        `SELECT DISTINCT item_id FROM measurement_responses WHERE session_id = $1`,
        [sessionId]
    );
    const answeredIds = new Set(answeredResult.rows.map(r => r.item_id));

    const missing = requiredItems.filter(item => !answeredIds.has(item.itemId));
    if (missing.length > 0) {
        throw new Error(
            `[Session] Missing required items: ${missing.map(i => i.itemId).join(', ')}`
        );
    }

    const result = await query(
        `UPDATE measurement_sessions 
     SET status = 'COMPLETED', completed_at = NOW()
     WHERE session_id = $1
     RETURNING *`,
        [sessionId]
    );

    return mapSession(result.rows[0]);
}

/**
 * Lock a session (COMPLETED → LOCKED). Immutable after this.
 */
export async function lockSession(sessionId: string): Promise<MeasurementSession> {
    const session = await getSession(sessionId);

    if (!session) {
        throw new Error(`[Session] Session "${sessionId}" not found`);
    }

    if (session.status !== 'COMPLETED') {
        throw new Error(`[Session] Cannot lock session in status "${session.status}"`);
    }

    const result = await query(
        `UPDATE measurement_sessions 
     SET status = 'LOCKED', locked_at = NOW()
     WHERE session_id = $1
     RETURNING *`,
        [sessionId]
    );

    return mapSession(result.rows[0]);
}

/**
 * Check if session is modifiable.
 */
export function isModifiable(session: MeasurementSession): boolean {
    return session.status === 'INVITED' || session.status === 'STARTED';
}

// ============================================================================
// Helpers
// ============================================================================

function mapSession(row: any): MeasurementSession {
    return {
        sessionId: row.session_id,
        userId: row.user_id,
        orgId: row.org_id,
        teamId: row.team_id,
        status: row.status,
        invitedAt: new Date(row.invited_at),
        startedAt: row.started_at ? new Date(row.started_at) : null,
        completedAt: row.completed_at ? new Date(row.completed_at) : null,
        lockedAt: row.locked_at ? new Date(row.locked_at) : null,
        weekStart: row.week_start,
    };
}

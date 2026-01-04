/**
 * SESSION — Production Session Management
 * 
 * Handles secure session tokens stored in DB with hashed values.
 */

import { createHash, randomBytes } from 'crypto';
import { query } from '@/db/client';

const SESSION_EXPIRY_DAYS = 30;
const SESSION_COOKIE_NAME = 'inpsyq_session';

export interface Session {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
}

/**
 * Generate a cryptographically secure session token.
 */
export function generateSessionToken(): string {
    return randomBytes(32).toString('base64url');
}

/**
 * Hash a session token for storage.
 */
export function hashSessionToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new session for a user.
 */
export async function createSession(
    userId: string,
    ip?: string,
    userAgent?: string
): Promise<{ session: Session; token: string }> {
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const result = await query(
        `INSERT INTO sessions (user_id, token_hash, expires_at, ip, user_agent)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING session_id as id, user_id, expires_at, created_at`,
        [userId, tokenHash, expiresAt, ip ?? null, userAgent ?? null]
    );

    const row = result.rows[0];
    return {
        session: {
            id: row.id,
            userId: row.user_id,
            expiresAt: new Date(row.expires_at),
            createdAt: new Date(row.created_at),
        },
        token,
    };
}

/**
 * Validate a session token and return the session if valid.
 */
export async function validateSession(token: string): Promise<Session | null> {
    const tokenHash = hashSessionToken(token);

    const result = await query(
        `SELECT session_id as id, user_id, expires_at, created_at
         FROM sessions
         WHERE token_hash = $1 AND expires_at > NOW()`,
        [tokenHash]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    // Update last_seen_at
    await query(`UPDATE sessions SET last_seen_at = NOW() WHERE id = $1`, [row.id]);

    return {
        id: row.id,
        userId: row.user_id,
        expiresAt: new Date(row.expires_at),
        createdAt: new Date(row.created_at),
    };
}

/**
 * Delete a session (logout).
 */
export async function deleteSession(token: string): Promise<boolean> {
    const tokenHash = hashSessionToken(token);
    const result = await query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
    return (result.rowCount ?? 0) > 0;
}

/**
 * Delete all sessions for a user.
 */
export async function deleteAllUserSessions(userId: string): Promise<number> {
    const result = await query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
    return result.rowCount ?? 0;
}

/**
 * Clean up expired sessions.
 */
export async function cleanupExpiredSessions(): Promise<number> {
    const result = await query(`DELETE FROM sessions WHERE expires_at < NOW()`);
    return result.rowCount ?? 0;
}

/**
 * Get session cookie name.
 */
export function getSessionCookieName(): string {
    return SESSION_COOKIE_NAME;
}

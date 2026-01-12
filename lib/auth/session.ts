/**
 * AUTH SESSION — Session Management
 * 
 * Handles creation, validation, and retrieval of user sessions.
 */

import { query } from '@/db/client';
import { randomBytes, createHash } from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'inpsyq_session';
const SESSION_DURATION_DAYS = 30;

export interface Session {
    userId: string;
    createdIp: string | null;
    userAgent: string | null;
    lastSeenAt: Date;
    expiresAt: Date;
}

/**
 * Get the session cookie name.
 */
export function getSessionCookieName(): string {
    return SESSION_COOKIE_NAME;
}

/**
 * Create a new session for a user.
 */
export async function createSession(
    userId: string,
    ip: string | null = null,
    userAgent: string | null = null
): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

    await query(
        `INSERT INTO sessions (user_id, token_hash, expires_at, ip, user_agent, started_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, tokenHash, expiresAt, ip, userAgent]
    );

    return { token, expiresAt };
}

/**
 * Get the current session from the cookie.
 */
export async function getSession(): Promise<Session | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const result = await query(
        `SELECT user_id, ip, user_agent, last_seen_at, expires_at 
         FROM sessions 
         WHERE token_hash = $1 AND expires_at > NOW()`,
        [tokenHash]
    );

    if (result.rows.length === 0) {
        return null;
    }

    // Update last_seen_at (side effect)
    await query(`UPDATE sessions SET last_seen_at = NOW() WHERE token_hash = $1`, [tokenHash]);

    const row = result.rows[0];
    return {
        userId: row.user_id,
        createdIp: row.ip,
        userAgent: row.user_agent,
        lastSeenAt: row.last_seen_at,
        expiresAt: row.expires_at,
    };
}

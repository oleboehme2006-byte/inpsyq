/**
 * LOGIN TOKENS — Magic Link Token Management
 * 
 * Creates and validates single-use login tokens with hashed storage.
 */

import { createHash, randomBytes } from 'crypto';
import { query } from '@/db/client';

const TOKEN_EXPIRY_MINUTES = 15;

export interface LoginToken {
    id: string;
    email: string;
    orgId?: string;
    role?: string;
    expiresAt: Date;
    usedAt?: Date;
}

/**
 * Normalize email for consistent lookups.
 */
export function normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
}

/**
 * Generate a cryptographically secure login token.
 */
export function generateLoginToken(): string {
    return randomBytes(32).toString('base64url');
}

/**
 * Hash a login token for storage.
 */
export function hashLoginToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new login token for an email.
 */
export async function createLoginToken(params: {
    email: string;
    orgId?: string;
    role?: string;
    ip?: string;
}): Promise<{ token: string; expiresAt: Date }> {
    const token = generateLoginToken();
    const tokenHash = hashLoginToken(token);
    const email = normalizeEmail(params.email);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await query(
        `INSERT INTO login_tokens (email, token_hash, org_id, role, expires_at, created_ip)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [email, tokenHash, params.orgId ?? null, params.role ?? null, expiresAt, params.ip ?? null]
    );

    return { token, expiresAt };
}

/**
 * Consume a login token (validate + mark as used).
 * Returns the token info if valid, null otherwise.
 */
export async function consumeLoginToken(token: string): Promise<LoginToken | null> {
    const tokenHash = hashLoginToken(token);

    // Atomic: select and update used_at in one query
    const result = await query(
        `UPDATE login_tokens
         SET used_at = NOW()
         WHERE token_hash = $1 
           AND expires_at > NOW() 
           AND used_at IS NULL
         RETURNING id, email, org_id, role, expires_at, used_at`,
        [tokenHash]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    return {
        id: row.id,
        email: row.email,
        orgId: row.org_id,
        role: row.role,
        expiresAt: new Date(row.expires_at),
        usedAt: row.used_at ? new Date(row.used_at) : undefined,
    };
}

/**
 * Check if an email has a valid pending invite or existing membership.
 */
export async function isEmailAllowed(email: string): Promise<{
    allowed: boolean;
    source: 'invite' | 'membership' | null;
    orgId?: string;
    role?: string;
}> {
    const normalizedEmail = normalizeEmail(email);

    // Check for existing user with membership
    const userResult = await query(
        `SELECT u.user_id, m.org_id, m.role
         FROM users u
         JOIN memberships m ON u.user_id = m.user_id
         WHERE LOWER(u.email) = $1
         LIMIT 1`,
        [normalizedEmail]
    );

    if (userResult.rows.length > 0) {
        const row = userResult.rows[0];
        return {
            allowed: true,
            source: 'membership',
            orgId: row.org_id,
            role: row.role,
        };
    }

    // Check for pending invite
    const inviteResult = await query(
        `SELECT org_id FROM active_invites 
         WHERE LOWER(email) = $1 
           AND expires_at > NOW()
           AND (max_uses IS NULL OR uses_count < max_uses)
         LIMIT 1`,
        [normalizedEmail]
    );

    if (inviteResult.rows.length > 0) {
        return {
            allowed: true,
            source: 'invite',
            orgId: inviteResult.rows[0].org_id,
        };
    }

    return { allowed: false, source: null };
}

/**
 * Clean up expired login tokens.
 */
export async function cleanupExpiredTokens(): Promise<number> {
    const result = await query(`DELETE FROM login_tokens WHERE expires_at < NOW()`);
    return result.rowCount ?? 0;
}

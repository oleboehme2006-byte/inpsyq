/**
 * ORG LIST API — List user's organizations
 * 
 * GET /api/org/list
 * 
 * Returns list of organizations the authenticated user belongs to.
 * Works even when NO_ORG_SELECTED (pre-org-selection state).
 */

import { NextResponse } from 'next/server';
import { query } from '@/db/client';
import { createHash } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_COOKIE_NAME = 'inpsyq_session';

/**
 * Extract and validate session from request cookies.
 * This is request-based, not ambient.
 */
async function getUserIdFromRequest(req: Request): Promise<string | null> {
    const cookieHeader = req.headers.get('cookie') || '';

    // Parse session cookie
    const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    const sessionToken = match?.[1];

    if (!sessionToken) return null;

    // Validate session
    const tokenHash = createHash('sha256').update(sessionToken).digest('hex');
    const result = await query(
        `SELECT user_id FROM sessions WHERE token_hash = $1 AND expires_at > NOW()`,
        [tokenHash]
    );

    if (result.rows.length === 0) return null;

    // Update last_seen_at
    await query(`UPDATE sessions SET last_seen_at = NOW() WHERE token_hash = $1`, [tokenHash]);

    return result.rows[0].user_id;
}

export async function GET(req: Request) {
    // Get userId directly from request cookies (request-based, not ambient)
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
        return NextResponse.json(
            { ok: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
            { status: 401 }
        );
    }

    // Get all org memberships with org names
    const result = await query(`
        SELECT m.org_id, o.name, m.role
        FROM memberships m
        JOIN orgs o ON m.org_id = o.org_id
        WHERE m.user_id = $1
        ORDER BY o.name
    `, [userId]);

    const orgs = result.rows.map((row: { org_id: string; name: string; role: string }) => ({
        orgId: row.org_id,
        name: row.name,
        role: row.role,
    }));

    return NextResponse.json({
        ok: true,
        data: { orgs }
    });
}

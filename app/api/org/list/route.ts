/**
 * ORG LIST API — List user's organizations
 * 
 * GET /api/org/list
 * 
 * Returns list of organizations the authenticated user belongs to.
 * Works BEFORE org selection (session-only auth).
 */

import { NextResponse } from 'next/server';
import { query } from '@/db/client';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_COOKIE_NAME = 'inpsyq_session';

async function getUserIdFromSession(req: Request): Promise<string | null> {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    const sessionToken = match?.[1];

    if (!sessionToken) return null;

    const { createHash } = await import('crypto');
    const tokenHash = createHash('sha256').update(sessionToken).digest('hex');

    const result = await query(
        `SELECT user_id FROM sessions WHERE token_hash = $1 AND expires_at > NOW()`,
        [tokenHash]
    );

    return result.rows.length > 0 ? result.rows[0].user_id : null;
}

export async function GET(req: Request) {
    const userId = await getUserIdFromSession(req);

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

    return NextResponse.json({ ok: true, data: { orgs } });
}


/**
 * ORG LIST API — List user's organizations
 * 
 * GET /api/org/list
 * 
 * Returns list of organizations the authenticated user belongs to.
 */

import { NextResponse } from 'next/server';
import { resolveAuthContextFromRequest } from '@/lib/auth/context';
import { query } from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const authResult = await resolveAuthContextFromRequest(req);

    // Need to be authenticated but don't require org selection
    if (!authResult.authenticated) {
        return NextResponse.json(
            { ok: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
            { status: 401 }
        );
    }

    // Get user ID from either context or partial auth
    const userId = authResult.context?.userId;
    if (!userId) {
        // User is authenticated but has no memberships - get from session
        return NextResponse.json(
            { ok: false, error: { code: 'NO_MEMBERSHIPS', message: 'No organization access' } },
            { status: 403 }
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

    return NextResponse.json({ ok: true, orgs });
}

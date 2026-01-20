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

import { getSession } from '@/lib/auth/session';

export async function GET(req: Request) {
    const authResult = await resolveAuthContextFromRequest(req);
    let userId = authResult.context?.userId;

    // Handle NO_ORG_SELECTED case - user is authenticated but context is partial
    // We need to resolve userId explicitly to list orgs
    if (!userId && authResult.error === 'NO_ORG_SELECTED') {
        const session = await getSession();
        if (session) {
            userId = session.userId;
        }
    }

    // Need to be authenticated
    if (!userId && !authResult.authenticated) {
        return NextResponse.json(
            { ok: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
            { status: 401 }
        );
    }

    if (!userId) {
        // Should have been caught above, but safety check
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

    return NextResponse.json({
        ok: true,
        data: { orgs }
    });
}

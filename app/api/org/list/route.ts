/**
 * ORG LIST API — List user's organizations
 * 
 * GET /api/org/list
 * 
 * Returns list of organizations the authenticated user belongs to.
 * This endpoint MUST work before org selection (pre-context).
 * 
 * Response contract:
 * - Success: { ok: true, data: { orgs: [{ orgId, name, role }] } }
 * - Error: { ok: false, error: { code, message } }
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/access/guards';
import { getMembershipsForUser } from '@/lib/access/tenancy';
import { query } from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // Authenticate user (works without org selection)
    const authResult = await getAuthenticatedUser(req);

    if (!authResult.ok) {
        return NextResponse.json(
            { ok: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
            { status: 401 }
        );
    }

    const { userId } = authResult.value;

    try {
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

    } catch (error: any) {
        console.error('[API] /org/list failed:', error.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load organizations' } },
            { status: 500 }
        );
    }
}

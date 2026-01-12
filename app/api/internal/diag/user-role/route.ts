/**
 * GET /api/internal/diag/user-role
 * 
 * Checks a user's role by email without logging in.
 * Protected by INTERNAL_ADMIN_SECRET.
 * 
 * Usage: ?email=user@example.com
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Verify secret
    const authHeader = req.headers.get('authorization');
    const expected = process.env.INTERNAL_ADMIN_SECRET;

    if (!expected || authHeader !== `Bearer ${expected}`) {
        return NextResponse.json(
            { ok: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
        return NextResponse.json({ ok: false, error: 'Email required' }, { status: 400 });
    }

    try {
        const result = await query(
            `SELECT u.user_id, u.email, m.org_id, m.role
             FROM users u
             LEFT JOIN memberships m ON u.user_id = m.user_id
             WHERE LOWER(u.email) = LOWER($1)`,
            [email]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({
                ok: true,
                found: false,
                email,
            });
        }

        const user = result.rows[0];
        // Collect all roles from rows
        const roles = result.rows
            .map(r => ({ orgId: r.org_id, role: r.role }))
            .filter(r => r.orgId); // Filter out rows with null orgId (if any outer join artifacts)

        return NextResponse.json({
            ok: true,
            found: true,
            user: {
                id: user.user_id,
                email: user.email,
            },
            roles,
        });

    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}

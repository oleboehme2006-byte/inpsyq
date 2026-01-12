/**
 * GET /api/internal/diag/whoami
 * 
 * Returns the currently authenticated user's session information.
 * Useful for debugging session cookies and RBAC.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { query } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({
                ok: true,
                authenticated: false,
                session: null,
            });
        }

        // Get user details (masked)
        const userResult = await query(
            `SELECT email, name FROM users WHERE user_id = $1`,
            [session.userId]
        );
        const user = userResult.rows[0];

        if (!user) {
            return NextResponse.json({
                ok: true,
                authenticated: true, // Session exists but user missing (data integrity issue)
                error: 'USER_NOT_FOUND',
                session: {
                    userId: session.userId,
                    createdIp: session.createdIp,
                },
            });
        }

        // Get memberships
        const memResult = await query(
            `SELECT org_id, role FROM memberships WHERE user_id = $1`,
            [session.userId]
        );

        return NextResponse.json({
            ok: true,
            authenticated: true,
            user: {
                id: session.userId,
                email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
                memberships: memResult.rows,
            },
            session: {
                createdIp: session.createdIp,
                userAgent: session.userAgent,
            },
        });

    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/internal/admin/mint-login-link
 * 
 * Mints a one-time magic link for TEST_ADMIN_EMAIL only.
 * Requires INTERNAL_ADMIN_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';
import { generateLoginToken, hashLoginToken } from '@/lib/auth/loginToken';
import { getPublicOrigin } from '@/lib/env/publicOrigin';

export const dynamic = 'force-dynamic';

const TEST_ADMIN_EMAIL = 'oleboehme2006@gmail.com';

export async function POST(req: NextRequest) {
    // Verify secret
    const authHeader = req.headers.get('authorization');
    const expected = process.env.INTERNAL_ADMIN_SECRET;

    if (!expected || authHeader !== `Bearer ${expected}`) {
        return NextResponse.json(
            { ok: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        // Only allow minting for test admin
        const body = await req.json().catch(() => ({}));
        const email = body.email || TEST_ADMIN_EMAIL;

        if (email.toLowerCase() !== TEST_ADMIN_EMAIL.toLowerCase()) {
            return NextResponse.json(
                { ok: false, error: 'Can only mint links for test admin email' },
                { status: 403 }
            );
        }

        // Get user
        const userResult = await query(
            `SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)`,
            [email]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { ok: false, error: 'User not found. Run /ensure first.' },
                { status: 400 }
            );
        }

        const userId = userResult.rows[0].user_id;

        // Generate token
        const token = generateLoginToken();
        const tokenHash = hashLoginToken(token);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Delete any existing tokens for this user
        await query(`DELETE FROM login_tokens WHERE user_id = $1`, [userId]);

        // Insert new token
        await query(
            `INSERT INTO login_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
            [userId, tokenHash, expiresAt]
        );

        // Build link
        const origin = getPublicOrigin().origin;
        const link = `${origin}/auth/consume?token=${encodeURIComponent(token)}`;

        console.log(`[AUDIT] mint-login-link called for ${email} from ${req.headers.get('x-forwarded-for') || 'unknown'}`);

        return NextResponse.json({
            ok: true,
            link,
            expiresAt: expiresAt.toISOString(),
        });

    } catch (e: any) {
        console.error('[API] mint-login-link failed:', e.message);
        return NextResponse.json(
            { ok: false, error: e.message },
            { status: 500 }
        );
    }
}

/**
 * MINT LOGIN LINK — Generate a magic link for admin testing
 * 
 * POST /api/internal/admin/mint-login-link
 * Body: { email: string }
 * Header: Authorization: Bearer {INTERNAL_ADMIN_SECRET}
 * 
 * Returns a magic link URL that can be used to log in as the specified user.
 * For internal admin/testing use only.
 */

import { NextResponse } from 'next/server';
import { query } from '@/db/client';
import { getPublicOriginUrl } from '@/lib/env/publicOrigin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INTERNAL_ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;

export async function POST(req: Request) {
    // Validate admin secret
    const authHeader = req.headers.get('authorization');
    if (!INTERNAL_ADMIN_SECRET || authHeader !== `Bearer ${INTERNAL_ADMIN_SECRET}`) {
        return NextResponse.json(
            { ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid admin secret' } },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { email } = body;

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'email is required' } },
                { status: 400 }
            );
        }

        // Find user by email
        const userResult = await query(
            `SELECT user_id, email FROM users WHERE LOWER(email) = LOWER($1)`,
            [email]
        );

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { ok: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
                { status: 404 }
            );
        }

        const userId = userResult.rows[0].user_id;

        // Generate token
        const { randomBytes, createHash } = await import('crypto');
        const token = randomBytes(32).toString('base64url');
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Store token
        await query(
            `INSERT INTO login_tokens (email, token_hash, expires_at)
             VALUES ($1, $2, $3)`,
            [email, tokenHash, expiresAt.toISOString()]
        );

        // Generate link
        const baseUrl = getPublicOriginUrl();
        const consumeUrl = `${baseUrl}/auth/consume?token=${encodeURIComponent(token)}`;

        return NextResponse.json({
            ok: true,
            data: {
                userId,
                email,
                consumeUrl,
                expiresAt: expiresAt.toISOString(),
            }
        });

    } catch (error: any) {
        console.error('[API] mint-login-link failed:', error.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}

/**
 * POST /api/internal/admin/mint-login-link
 * 
 * Mints a one-time magic link for TEST_ADMIN_EMAIL only.
 * Uses the canonical login token creation logic.
 * Requires INTERNAL_ADMIN_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLoginToken } from '@/lib/auth/loginToken';
import { getPublicOrigin } from '@/lib/env/publicOrigin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TEST_ADMIN_EMAIL = 'oleboehme2006@gmail.com';

export async function POST(req: NextRequest) {
    // Verify secret
    const authHeader = req.headers.get('authorization');
    const expected = process.env.INTERNAL_ADMIN_SECRET;

    if (!expected || authHeader !== `Bearer ${expected}`) {
        return NextResponse.json(
            { ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing authorization' } },
            { status: 401 }
        );
    }

    try {
        // Only allow minting for test admin
        const body = await req.json().catch(() => ({}));
        const email = body.email || TEST_ADMIN_EMAIL;

        if (email.toLowerCase() !== TEST_ADMIN_EMAIL.toLowerCase()) {
            return NextResponse.json(
                { ok: false, error: { code: 'FORBIDDEN', message: 'Can only mint links for test admin email' } },
                { status: 403 }
            );
        }

        // Create login token using canonical method
        const { token, expiresAt } = await createLoginToken({
            email,
            ip: req.headers.get('x-forwarded-for') || undefined,
        });

        // Build link with canonical origin
        const origin = getPublicOrigin().origin;
        const url = `${origin}/auth/consume?token=${encodeURIComponent(token)}`;

        console.log(`[AUDIT] mint-login-link called for ${email} from ${req.headers.get('x-forwarded-for') || 'unknown'}`);

        return NextResponse.json({
            ok: true,
            data: {
                url,
                email,
                expiresAt: expiresAt.toISOString(),
            },
        });

    } catch (e: any) {
        console.error('[API] mint-login-link failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: e.message } },
            { status: 500 }
        );
    }
}

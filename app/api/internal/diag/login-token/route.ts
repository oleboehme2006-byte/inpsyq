/**
 * Login Token Diagnostic Endpoint
 * 
 * GET /api/internal/diag/login-token?token=...
 * 
 * Returns status of a login token without consuming it.
 * Requires INTERNAL_ADMIN_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { hashLoginToken } from '@/lib/auth/loginToken';
import { query } from '@/db/client';

export const runtime = 'nodejs';
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

    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
        return NextResponse.json(
            { ok: false, error: 'Token parameter required' },
            { status: 400 }
        );
    }

    try {
        // Hash the token (never log or return the raw token)
        const tokenHash = hashLoginToken(token);

        // Look up the token
        const result = await query(
            `SELECT id, expires_at, used_at, created_at
             FROM login_tokens 
             WHERE token_hash = $1`,
            [tokenHash]
        );

        const now = new Date();

        if (result.rows.length === 0) {
            return NextResponse.json({
                ok: true,
                found: false,
                status: 'NOT_FOUND',
                now: now.toISOString(),
                tokenHashPrefix: tokenHash.slice(0, 8) + '...',
            });
        }

        const row = result.rows[0];
        const expiresAt = new Date(row.expires_at);
        const usedAt = row.used_at ? new Date(row.used_at) : null;
        const createdAt = new Date(row.created_at);

        let status: string;
        if (usedAt) {
            status = 'USED';
        } else if (expiresAt < now) {
            status = 'EXPIRED';
        } else {
            status = 'OK';
        }

        return NextResponse.json({
            ok: true,
            found: true,
            status,
            createdAt: createdAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            usedAt: usedAt?.toISOString() || null,
            now: now.toISOString(),
            tokenHashPrefix: tokenHash.slice(0, 8) + '...',
            // Time calculations
            expiresInMs: expiresAt.getTime() - now.getTime(),
            ageMs: now.getTime() - createdAt.getTime(),
        });

    } catch (e: any) {
        console.error('[DIAG] Login token lookup failed:', e.message);
        return NextResponse.json(
            { ok: false, error: 'Internal error' },
            { status: 500 }
        );
    }
}

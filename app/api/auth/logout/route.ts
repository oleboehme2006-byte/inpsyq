/**
 * LOGOUT API — Clear Session
 * 
 * POST /api/auth/logout
 * 
 * Clears the session cookie and deletes session from DB.
 */

import { NextResponse } from 'next/server';
import { deleteSession, getSessionCookieName } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const requestId = crypto.randomUUID();

    try {
        // Get session token from cookie
        const cookieHeader = req.headers.get('cookie') || '';
        const sessionCookieName = getSessionCookieName();
        const match = cookieHeader.match(new RegExp(`${sessionCookieName}=([^;]+)`));
        const sessionToken = match?.[1];

        if (sessionToken) {
            await deleteSession(sessionToken);
        }

        // Clear cookie
        const isProd = process.env.NODE_ENV === 'production';
        const clearCookie = `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}; Max-Age=0`;

        return NextResponse.json(
            { ok: true, request_id: requestId },
            { headers: { 'Set-Cookie': clearCookie } }
        );

    } catch (error: any) {
        console.error('[API] /auth/logout failed:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

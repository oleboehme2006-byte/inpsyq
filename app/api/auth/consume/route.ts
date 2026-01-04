/**
 * CONSUME API — Consume Magic Link Token
 * 
 * GET /api/auth/consume?token=...
 * 
 * Validates and consumes token, creates session, redirects to dashboard.
 */

import { NextResponse } from 'next/server';
import { consumeLoginToken } from '@/lib/auth/loginToken';
import { createSession, getSessionCookieName } from '@/lib/auth/session';
import { query } from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
        return new NextResponse(renderErrorPage('Missing token'), {
            status: 400,
            headers: { 'Content-Type': 'text/html' },
        });
    }

    try {
        // Consume the login token
        const loginToken = await consumeLoginToken(token);

        if (!loginToken) {
            return new NextResponse(renderErrorPage('Invalid or expired link'), {
                status: 400,
                headers: { 'Content-Type': 'text/html' },
            });
        }

        // Find or create user
        let userId: string;
        const userResult = await query(
            `SELECT user_id FROM users WHERE LOWER(email) = $1`,
            [loginToken.email]
        );

        if (userResult.rows.length > 0) {
            userId = userResult.rows[0].user_id;
        } else {
            // Create new user
            const newUserResult = await query(
                `INSERT INTO users (email, name) VALUES ($1, $2) RETURNING user_id`,
                [loginToken.email, loginToken.email.split('@')[0]]
            );
            userId = newUserResult.rows[0].user_id;
            console.log(`[AUTH] Created new user for ${loginToken.email}`);
        }

        // Check/create membership if org_id provided
        if (loginToken.orgId) {
            const membershipResult = await query(
                `SELECT membership_id FROM memberships WHERE user_id = $1 AND org_id = $2`,
                [userId, loginToken.orgId]
            );

            if (membershipResult.rows.length === 0) {
                // Create membership from invite
                await query(
                    `INSERT INTO memberships (user_id, org_id, role) VALUES ($1, $2, $3)`,
                    [userId, loginToken.orgId, loginToken.role || 'EMPLOYEE']
                );
                console.log(`[AUTH] Created membership for ${loginToken.email} in org ${loginToken.orgId}`);

                // Mark invite as used
                await query(
                    `UPDATE active_invites SET uses_count = uses_count + 1 WHERE LOWER(email) = $1 AND org_id = $2`,
                    [loginToken.email, loginToken.orgId]
                );
            }
        }

        // Get IP and user agent
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
            req.headers.get('x-real-ip') || undefined;
        const userAgent = req.headers.get('user-agent') || undefined;

        // Create session
        const { token: sessionToken } = await createSession(userId, ip, userAgent);

        // Determine redirect
        const membershipCheck = await query(
            `SELECT role FROM memberships WHERE user_id = $1 ORDER BY created_at LIMIT 1`,
            [userId]
        );
        const primaryRole = membershipCheck.rows[0]?.role || 'EMPLOYEE';
        const redirectPath = primaryRole === 'ADMIN' ? '/admin' : '/executive';

        // Set session cookie and redirect
        const isProd = process.env.NODE_ENV === 'production';
        const cookieValue = `${getSessionCookieName()}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}; Max-Age=${30 * 24 * 60 * 60}`;

        return new NextResponse(null, {
            status: 302,
            headers: {
                'Location': redirectPath,
                'Set-Cookie': cookieValue,
            },
        });

    } catch (error: any) {
        console.error('[API] /auth/consume failed:', error.message);
        return new NextResponse(renderErrorPage('An error occurred. Please try again.'), {
            status: 500,
            headers: { 'Content-Type': 'text/html' },
        });
    }
}

function renderErrorPage(message: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Login Error - InPsyq</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; }
        .card { background: white; padding: 48px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
        h1 { color: #dc2626; margin: 0 0 16px; font-size: 24px; }
        p { color: #6b7280; margin: 0 0 24px; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Login Error</h1>
        <p>${message}</p>
        <a href="/login">Try Again</a>
    </div>
</body>
</html>
    `.trim();
}

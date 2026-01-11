/**
 * CONSUME API — POST-only Magic Link Token Consumption
 * 
 * POST /api/auth/consume
 * Body: { token: string }
 * 
 * Returns JSON: { ok: true, redirectTo: "..." } or { ok: false, error: {...} }
 * 
 * GET is rejected with 405 to prevent scanner consumption.
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeLoginToken } from '@/lib/auth/loginToken';
import { createSession, getSessionCookieName } from '@/lib/auth/session';
import { query } from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET is rejected - scanners cannot consume tokens
export async function GET() {
    return NextResponse.json(
        {
            ok: false,
            error: {
                code: 'METHOD_NOT_ALLOWED',
                message: 'Use POST to consume login tokens',
            },
        },
        { status: 405 }
    );
}

// POST consumes the token
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const token = body.token;

        // Validate token presence
        if (!token || typeof token !== 'string') {
            return NextResponse.json(
                {
                    ok: false,
                    error: { code: 'MISSING_TOKEN', message: 'Token is required' },
                },
                { status: 400 }
            );
        }

        // Validate token length (invariant check)
        if (token.length < 20) {
            return NextResponse.json(
                {
                    ok: false,
                    error: { code: 'INVALID_TOKEN', message: 'Invalid login link' },
                },
                { status: 400 }
            );
        }

        // Consume the login token
        const loginToken = await consumeLoginToken(token);

        if (!loginToken) {
            return NextResponse.json(
                {
                    ok: false,
                    error: { code: 'INVALID_OR_EXPIRED', message: 'This login link is invalid or has already been used' },
                },
                { status: 400 }
            );
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

        // Determine redirect based on memberships
        const membershipResult = await query(
            `SELECT org_id, role, team_id FROM memberships WHERE user_id = $1`,
            [userId]
        );

        let redirectPath: string;
        const cookies: string[] = [];
        const isProd = process.env.NODE_ENV === 'production';

        // Session cookie
        cookies.push(`${getSessionCookieName()}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}; Max-Age=${30 * 24 * 60 * 60}`);

        if (membershipResult.rows.length === 0) {
            // No memberships yet - send to login (edge case)
            redirectPath = '/login';
        } else if (membershipResult.rows.length === 1) {
            // Single org - auto-select and redirect by role
            const { org_id, role, team_id } = membershipResult.rows[0];
            cookies.push(`inpsyq_selected_org=${org_id}; Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}; Max-Age=${30 * 24 * 60 * 60}`);

            switch (role) {
                case 'ADMIN':
                    redirectPath = '/admin';
                    break;
                case 'EXECUTIVE':
                    redirectPath = '/executive';
                    break;
                case 'TEAMLEAD':
                    redirectPath = team_id ? `/team/${team_id}` : '/team';
                    break;
                case 'EMPLOYEE':
                default:
                    redirectPath = '/measure';
            }
        } else {
            // Multiple orgs - force org selection
            redirectPath = '/org/select';
        }

        // Return JSON with cookies in header
        const response = NextResponse.json({
            ok: true,
            redirectTo: redirectPath,
        });

        // Set cookies
        for (const cookie of cookies) {
            response.headers.append('Set-Cookie', cookie);
        }

        return response;

    } catch (error: any) {
        console.error('[API] /auth/consume POST failed:', error.message);
        return NextResponse.json(
            {
                ok: false,
                error: { code: 'INTERNAL_ERROR', message: 'An error occurred. Please try again.' },
            },
            { status: 500 }
        );
    }
}

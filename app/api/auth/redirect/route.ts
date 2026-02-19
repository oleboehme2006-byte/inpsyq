/**
 * POST-LOGIN REDIRECT — /api/auth/redirect
 * 
 * Called by middleware when authenticated user visits "/".
 * Looks up user's org membership and redirects to the correct dashboard.
 * 
 * Flow:
 * 1. Get Clerk userId via auth()
 * 2. Look up internal user by clerk_id
 * 3. Look up memberships
 * 4. Redirect based on role:
 *    - ADMIN -> /admin
 *    - EXECUTIVE -> /executive (or /[orgSlug]/executive when slugs are populated)
 *    - TEAMLEAD -> /team/[teamId]
 *    - EMPLOYEE -> /measure
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { query } from '@/db/client';

export const runtime = 'nodejs';

export async function GET() {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    }

    try {
        // 1. Find internal user by clerk_id
        const userResult = await query(
            `SELECT user_id FROM users WHERE clerk_id = $1`,
            [clerkId]
        );

        if (userResult.rows.length === 0) {
            // User authenticated in Clerk but not yet synced to DB
            // Redirect to a "pending" page or back to landing
            console.warn(`[Auth Redirect] Clerk user ${clerkId} not found in DB`);
            return NextResponse.redirect(new URL('/?error=not_synced', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
        }

        const internalUserId = userResult.rows[0].user_id;

        // 2. Find primary membership
        const membershipResult = await query(
            `SELECT m.org_id, m.team_id, m.role, o.slug, o.name
             FROM memberships m
             JOIN orgs o ON m.org_id = o.org_id
             WHERE m.user_id = $1
             ORDER BY m.created_at ASC
             LIMIT 1`,
            [internalUserId]
        );

        if (membershipResult.rows.length === 0) {
            console.warn(`[Auth Redirect] User ${internalUserId} has no memberships`);
            return NextResponse.redirect(new URL('/?error=no_org', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
        }

        const membership = membershipResult.rows[0];
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // 3. Redirect based on role
        switch (membership.role) {
            case 'ADMIN':
                return NextResponse.redirect(new URL('/admin', baseUrl));
            case 'EXECUTIVE':
                return NextResponse.redirect(new URL('/executive', baseUrl));
            case 'TEAMLEAD':
                if (membership.team_id) {
                    return NextResponse.redirect(new URL(`/team/${membership.team_id}`, baseUrl));
                }
                return NextResponse.redirect(new URL('/executive', baseUrl));
            case 'EMPLOYEE':
                return NextResponse.redirect(new URL('/measure', baseUrl));
            default:
                return NextResponse.redirect(new URL('/executive', baseUrl));
        }
    } catch (error: any) {
        console.error('[Auth Redirect] Error:', error.message);
        return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    }
}

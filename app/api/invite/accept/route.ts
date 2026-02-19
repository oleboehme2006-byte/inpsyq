/**
 * POST /api/invite/accept
 * 
 * Redeems an invite token for the currently authenticated Clerk user.
 * Creates a membership row and returns the redirect URL.
 * 
 * Flow:
 * 1. Validate the token (signature + expiry)
 * 2. Get Clerk user → find or create internal user
 * 3. Create membership (org + role + team)
 * 4. Invalidate the invite token
 * 5. Return redirect URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { query } from '@/db/client';
import { parseInviteToken } from '@/lib/access/invite';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        // 1. Require Clerk auth
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json(
                { ok: false, error: 'Not authenticated. Please sign in first.' },
                { status: 401 }
            );
        }

        // 2. Get the token from the body
        const body = await req.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json(
                { ok: false, error: 'Missing invite token' },
                { status: 400 }
            );
        }

        // 3. Parse and validate the invite token
        const parsed = parseInviteToken(token);
        if (!parsed.ok) {
            return NextResponse.json(
                { ok: false, error: parsed.error },
                { status: 400 }
            );
        }

        const { orgId, teamId, role, email } = parsed.payload;

        // 4. Find or create the internal user
        await query('BEGIN');

        let internalUserId: string;

        const existingByClerk = await query(
            'SELECT user_id FROM users WHERE clerk_id = $1',
            [clerkId]
        );

        if (existingByClerk.rows.length > 0) {
            internalUserId = existingByClerk.rows[0].user_id;
        } else {
            // Create a new user linked to this Clerk ID
            const userId = crypto.randomUUID();
            await query(
                'INSERT INTO users (user_id, clerk_id, email) VALUES ($1, $2, $3)',
                [userId, clerkId, email || null]
            );
            internalUserId = userId;
        }

        // 5. Check if already a member of this org
        const existingMembership = await query(
            'SELECT membership_id FROM memberships WHERE user_id = $1 AND org_id = $2',
            [internalUserId, orgId]
        );

        if (existingMembership.rows.length > 0) {
            await query('COMMIT');
            // Already a member — just redirect them
            return NextResponse.json({
                ok: true,
                message: 'You are already a member of this organization',
                redirectTo: getRedirectForAcceptedRole(role, teamId),
            });
        }

        // 6. Create the membership
        await query(
            `INSERT INTO memberships (user_id, org_id, team_id, role, is_active)
             VALUES ($1, $2, $3, $4, true)`,
            [internalUserId, orgId, teamId || null, role]
        );

        // 7. Invalidate the invite (remove from active_invites)
        const signature = token.split('.')[1];
        await query(
            'DELETE FROM active_invites WHERE payload_signature = $1',
            [signature]
        );

        await query('COMMIT');

        // 8. Return success with redirect
        return NextResponse.json({
            ok: true,
            message: 'Invitation accepted!',
            redirectTo: getRedirectForAcceptedRole(role, teamId),
        });

    } catch (e: any) {
        try { await query('ROLLBACK'); } catch { }
        console.error('[Invite Accept] Error:', e.message);
        return NextResponse.json(
            { ok: false, error: 'Failed to accept invitation' },
            { status: 500 }
        );
    }
}

function getRedirectForAcceptedRole(role: string, teamId?: string): string {
    switch (role) {
        case 'ADMIN': return '/admin';
        case 'EXECUTIVE': return '/executive';
        case 'TEAMLEAD': return teamId ? `/team/${teamId}` : '/executive';
        case 'EMPLOYEE': return '/measure';
        default: return '/';
    }
}

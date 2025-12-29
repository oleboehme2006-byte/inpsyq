/**
 * ACCEPT INVITE API — Accept Invite and Create Membership
 * 
 * POST /api/access/accept-invite
 */

import { NextResponse } from 'next/server';
import { parseInviteToken } from '@/lib/access/invite';
import { createMembership } from '@/lib/access/tenancy';
import { getAuthenticatedUser } from '@/lib/access/guards';
import { query } from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const requestId = crypto.randomUUID();

    try {
        const body = await req.json();
        const { inviteToken, userId: providedUserId } = body;

        // Validate invite token
        if (!inviteToken || typeof inviteToken !== 'string') {
            return NextResponse.json(
                { error: 'inviteToken is required', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        const parsed = parseInviteToken(inviteToken);
        if (!parsed.ok) {
            return NextResponse.json(
                { error: parsed.error, code: 'INVALID_TOKEN', request_id: requestId },
                { status: 400 }
            );
        }
        const { orgId, teamId, role, email } = parsed.payload;

        // One-Time Use Enforcement
        const signature = inviteToken.split('.')[1];
        const consumeRes = await query(`
            DELETE FROM active_invites 
            WHERE payload_signature = $1 
            RETURNING payload_signature
        `, [signature]);

        if (consumeRes.rows.length === 0) {
            return NextResponse.json(
                { error: 'Invite token already used or expired', code: 'TOKEN_CONSUMED', request_id: requestId },
                { status: 409 }
            );
        }

        // Determine userId: from auth or from body
        let userId: string;

        const authResult = await getAuthenticatedUser(req);
        if (authResult.ok) {
            userId = authResult.value.userId;
        } else if (providedUserId && typeof providedUserId === 'string') {
            // Allow providing userId in body (for dev/testing)
            userId = providedUserId;

            // Verify user exists
            const userResult = await query(`SELECT user_id FROM users WHERE user_id = $1`, [userId]);
            if (userResult.rows.length === 0) {
                return NextResponse.json(
                    { error: 'User not found', code: 'NOT_FOUND', request_id: requestId },
                    { status: 404 }
                );
            }
        } else {
            return NextResponse.json(
                { error: 'Authentication required or userId must be provided', code: 'UNAUTHORIZED', request_id: requestId },
                { status: 401 }
            );
        }

        // Create the membership
        const membership = await createMembership(userId, orgId, role, teamId ?? undefined);

        return NextResponse.json({
            ok: true,
            membership: {
                membershipId: membership.membershipId,
                userId: membership.userId,
                orgId: membership.orgId,
                teamId: membership.teamId,
                role: membership.role,
            },
            request_id: requestId,
        });

    } catch (error: any) {
        console.error('[API] /access/accept-invite failed:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

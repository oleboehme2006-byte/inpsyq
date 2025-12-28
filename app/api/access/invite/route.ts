/**
 * INVITE API — Create Invite Tokens
 * 
 * POST /api/access/invite
 * Requires EXECUTIVE or ADMIN role in the target org.
 */

import { NextResponse } from 'next/server';
import { createInviteToken } from '@/lib/access/invite';
import { requireRole } from '@/lib/access/guards';
import { isValidRole, Role } from '@/lib/access/roles';
import { query } from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const requestId = crypto.randomUUID();

    try {
        const body = await req.json();
        const { orgId, teamId, role, email } = body;

        // Validate required fields
        if (!orgId || typeof orgId !== 'string') {
            return NextResponse.json(
                { error: 'orgId is required', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        if (!role || !isValidRole(role)) {
            return NextResponse.json(
                { error: 'role must be one of: ADMIN, EXECUTIVE, TEAMLEAD, EMPLOYEE', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        // Verify org exists
        const orgResult = await query(`SELECT org_id FROM orgs WHERE org_id = $1`, [orgId]);
        if (orgResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Organization not found', code: 'NOT_FOUND', request_id: requestId },
                { status: 404 }
            );
        }

        // If teamId provided, verify it exists and belongs to org
        if (teamId) {
            const teamResult = await query(
                `SELECT team_id FROM teams WHERE team_id = $1 AND org_id = $2`,
                [teamId, orgId]
            );
            if (teamResult.rows.length === 0) {
                return NextResponse.json(
                    { error: 'Team not found in this organization', code: 'NOT_FOUND', request_id: requestId },
                    { status: 404 }
                );
            }
        }

        // Require EXECUTIVE or ADMIN to create invites
        const guardResult = await requireRole(req, orgId, ['ADMIN', 'EXECUTIVE']);
        if (!guardResult.ok) {
            return guardResult.response;
        }

        // Create the invite token
        const inviteToken = createInviteToken({
            orgId,
            teamId,
            role: role as Role,
            email,
        });

        return NextResponse.json({
            inviteToken,
            request_id: requestId,
            expiresIn: '72 hours',
        });

    } catch (error: any) {
        console.error('[API] /access/invite failed:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

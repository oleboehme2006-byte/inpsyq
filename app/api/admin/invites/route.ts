/**
 * GET/POST /api/admin/invites
 * 
 * List and create invites for the organization.
 * ADMIN only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { query } from '@/db/client';
import { createInviteToken } from '@/lib/access/invite';
import { isValidRole, Role } from '@/lib/access/roles';
import { SECURITY_LIMITS } from '@/lib/security/limits';
import { getEmailTransport } from '@/services/email/transport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const requestId = crypto.randomUUID();

    // Admin guard
    const guardResult = await requireAdminStrict(req);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    const { orgId } = guardResult.value;

    try {
        const result = await query(`
            SELECT 
                payload_signature as invite_id,
                org_id,
                created_by,
                created_at,
                expires_at
            FROM active_invites
            WHERE org_id = $1 AND expires_at > NOW()
            ORDER BY created_at DESC
        `, [orgId]);

        return NextResponse.json({
            ok: true,
            invites: result.rows.map(row => ({
                inviteId: row.invite_id,
                orgId: row.org_id,
                createdBy: row.created_by,
                createdAt: row.created_at,
                expiresAt: row.expires_at,
            })),
            request_id: requestId,
        });
    } catch (e: any) {
        console.error('[Admin] GET /invites failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch invites' }, request_id: requestId },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();

    // Admin guard
    const guardResult = await requireAdminStrict(req);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    const { orgId, userId: adminUserId } = guardResult.value;

    try {
        const body = await req.json();
        const { email, role, teamId } = body;

        // Validate required fields
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Valid email is required' }, request_id: requestId },
                { status: 400 }
            );
        }

        if (!role || !isValidRole(role)) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'role must be one of: EMPLOYEE, TEAMLEAD, EXECUTIVE, ADMIN' }, request_id: requestId },
                { status: 400 }
            );
        }

        // Enforce role-team consistency
        if (role === 'TEAMLEAD' && !teamId) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'TEAMLEAD invite must specify a team' }, request_id: requestId },
                { status: 400 }
            );
        }

        if ((role === 'EXECUTIVE' || role === 'ADMIN' || role === 'EMPLOYEE') && teamId) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: `${role} invite must not specify a team` }, request_id: requestId },
                { status: 400 }
            );
        }

        // If teamId, verify it exists in org
        if (teamId) {
            const teamResult = await query(
                'SELECT team_id FROM teams WHERE team_id = $1 AND org_id = $2',
                [teamId, orgId]
            );
            if (teamResult.rows.length === 0) {
                return NextResponse.json(
                    { ok: false, error: { code: 'NOT_FOUND', message: 'Team not found in this organization' }, request_id: requestId },
                    { status: 404 }
                );
            }
        }

        // Check invite limit
        const countRes = await query('SELECT COUNT(*) as count FROM active_invites WHERE org_id = $1', [orgId]);
        if (parseInt(countRes.rows[0].count, 10) >= SECURITY_LIMITS.MAX_INVITES_PER_ORG) {
            return NextResponse.json(
                { ok: false, error: { code: 'LIMIT_EXCEEDED', message: 'Maximum outstanding invites limit reached' }, request_id: requestId },
                { status: 429 }
            );
        }

        // Create the invite token
        const inviteToken = createInviteToken({
            orgId,
            teamId: teamId || undefined,
            role: role as Role,
            email,
        });

        const signature = inviteToken.split('.')[1];

        // Track active invite
        await query(`
            INSERT INTO active_invites (payload_signature, org_id, created_by, expires_at)
            VALUES ($1, $2, $3, NOW() + INTERVAL '72 hours')
        `, [signature, orgId, adminUserId]);

        // Send email
        let emailSent = false;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const inviteLink = `${baseUrl}/invite/accept?token=${inviteToken}`;

        try {
            const transport = getEmailTransport();
            const result = await transport.send({
                to: email,
                subject: 'You are invited to join InPsyq',
                text: `You have been invited to join InPsyq as ${role}.\n\nClick here to accept: ${inviteLink}\n\nThis link expires in 72 hours.`,
                html: `<p>You have been invited to join InPsyq as <strong>${role}</strong>.</p><p><a href="${inviteLink}">Click here to accept your invitation</a></p><p>This link expires in 72 hours.</p>`,
            });
            emailSent = result.ok;
        } catch (emailError: any) {
            console.error('[Admin] Failed to send invite email:', emailError.message);
        }

        return NextResponse.json({
            ok: true,
            inviteId: signature,
            emailSent,
            expiresIn: '72 hours',
            request_id: requestId,
        });

    } catch (e: any) {
        console.error('[Admin] POST /invites failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create invite' }, request_id: requestId },
            { status: 500 }
        );
    }
}

/**
 * POST/GET /api/org/invite
 * 
 * Send invitations and list pending invites for the caller's organization.
 * Gated to EXECUTIVE and ADMIN roles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireOrgManagement } from '@/lib/access/guards';
import { query } from '@/db/client';
import { createInviteToken } from '@/lib/access/invite';
import { isValidRole, Role } from '@/lib/access/roles';
import { getEmailTransport } from '@/services/email/transport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PENDING_INVITES = 100;

export async function GET(req: NextRequest) {
    const guardResult = await requireOrgManagement(req);
    if (!guardResult.ok) return guardResult.response;

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
                createdBy: row.created_by,
                createdAt: row.created_at,
                expiresAt: row.expires_at,
            })),
        });
    } catch (e: any) {
        console.error('[Org] GET /invite failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch invites' } },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const guardResult = await requireOrgManagement(req);
    if (!guardResult.ok) return guardResult.response;

    const { orgId, userId: senderUserId } = guardResult.value;

    try {
        const body = await req.json();
        const { email, role, teamId } = body;

        // Validate email
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Valid email is required' } },
                { status: 400 }
            );
        }

        // Validate role
        if (!role || !isValidRole(role)) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'role must be EMPLOYEE, TEAMLEAD, EXECUTIVE, or ADMIN' } },
                { status: 400 }
            );
        }

        // Role-team consistency
        if (role === 'TEAMLEAD' && !teamId) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'TEAMLEAD must specify a team' } },
                { status: 400 }
            );
        }

        if (teamId && (role === 'EXECUTIVE' || role === 'ADMIN' || role === 'EMPLOYEE')) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: `${role} must not specify a team` } },
                { status: 400 }
            );
        }

        // Verify team exists
        if (teamId) {
            const teamCheck = await query(
                'SELECT team_id FROM teams WHERE team_id = $1 AND org_id = $2',
                [teamId, orgId]
            );
            if (teamCheck.rows.length === 0) {
                return NextResponse.json(
                    { ok: false, error: { code: 'NOT_FOUND', message: 'Team not found' } },
                    { status: 404 }
                );
            }
        }

        // Check invite limit
        const countRes = await query(
            'SELECT COUNT(*) as count FROM active_invites WHERE org_id = $1 AND expires_at > NOW()',
            [orgId]
        );
        if (parseInt(countRes.rows[0].count, 10) >= MAX_PENDING_INVITES) {
            return NextResponse.json(
                { ok: false, error: { code: 'LIMIT_EXCEEDED', message: 'Maximum pending invites reached' } },
                { status: 429 }
            );
        }

        // Check if user is already a member
        const existingMember = await query(
            `SELECT u.user_id FROM users u 
             JOIN memberships m ON u.user_id = m.user_id 
             WHERE LOWER(u.email) = LOWER($1) AND m.org_id = $2`,
            [email, orgId]
        );
        if (existingMember.rows.length > 0) {
            return NextResponse.json(
                { ok: false, error: { code: 'DUPLICATE', message: 'This email is already a member of your organization' } },
                { status: 409 }
            );
        }

        // Create invite token
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
        `, [signature, orgId, senderUserId]);

        // Send email
        let emailSent = false;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const inviteLink = `${baseUrl}/invite/accept?token=${inviteToken}`;

        // Get org name for the email
        const orgRes = await query('SELECT name FROM orgs WHERE org_id = $1', [orgId]);
        const orgName = orgRes.rows[0]?.name || 'your organization';

        try {
            const transport = getEmailTransport();
            await transport.send({
                to: email,
                subject: `Join ${orgName} on InPsyq`,
                text: `You've been invited to join ${orgName} on InPsyq as ${role}.\n\nAccept your invitation: ${inviteLink}\n\nThis link expires in 72 hours.`,
                html: `
                    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto;">
                        <h2 style="color: #1a1a2e;">You're invited to ${orgName}</h2>
                        <p>You've been invited to join <strong>${orgName}</strong> on InPsyq as <strong>${role}</strong>.</p>
                        <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; margin: 16px 0;">Accept Invitation</a>
                        <p style="color: #666; font-size: 13px;">This link expires in 72 hours.</p>
                    </div>
                `,
            });
            emailSent = true;
        } catch (emailError: any) {
            console.error('[Org] Failed to send invite email:', emailError.message);
        }

        return NextResponse.json({
            ok: true,
            inviteId: signature,
            emailSent,
            expiresIn: '72 hours',
        });

    } catch (e: any) {
        console.error('[Org] POST /invite failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create invite' } },
            { status: 500 }
        );
    }
}

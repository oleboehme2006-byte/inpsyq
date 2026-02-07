
/**
 * POST /api/admin/roster/import
 * 
 * Bulk import of users via CSV-derived JSON.
 * - Creates teams if they don't exist
 * - Creates invites for users
 * - Transactional per batch
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { getClient } from '@/db/client';
import { createInviteToken } from '@/lib/access/invite';
import { isValidRole, Role } from '@/lib/access/roles';
import { getEmailTransport } from '@/services/email/transport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ImportUser {
    email: string;
    role: string;
    teamName?: string;
    name?: string;
}

interface ImportRequest {
    users: ImportUser[];
}

export async function POST(req: NextRequest) {
    const requestId = crypto.randomUUID();

    // 1. Admin Guard
    const guardResult = await requireAdminStrict(req);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    const { orgId, userId: adminUserId } = guardResult.value;

    try {
        const body = await req.json() as ImportRequest;
        if (!body.users || !Array.isArray(body.users) || body.users.length === 0) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'No users provided' }, request_id: requestId },
                { status: 400 }
            );
        }

        if (body.users.length > 500) {
            return NextResponse.json(
                { ok: false, error: { code: 'LIMIT_EXCEEDED', message: 'Batch size limit (500) exceeded' }, request_id: requestId },
                { status: 400 }
            );
        }

        const client = await getClient();
        const transport = getEmailTransport();
        const results: any[] = [];
        let successCount = 0;
        let failCount = 0;

        try {
            await client.query('BEGIN');

            // Cache teams to avoid repeated DB lookups in the same transaction
            const teamCache = new Map<string, string>(); // Name -> ID

            // Pre-fetch existing teams
            const existingTeamsRes = await client.query(
                `SELECT team_id, name FROM teams WHERE org_id = $1`,
                [orgId]
            );
            existingTeamsRes.rows.forEach(r => teamCache.set(r.name.toLowerCase().trim(), r.team_id));

            for (const user of body.users) {
                const resultItem = { email: user.email, status: 'pending', error: null as string | null };

                // --- Validation ---
                if (!user.email || !user.email.includes('@')) {
                    resultItem.status = 'error';
                    resultItem.error = 'Invalid email';
                    results.push(resultItem);
                    failCount++;
                    continue;
                }

                // Normalize Role
                const roleStr = user.role.toUpperCase();
                if (!isValidRole(roleStr)) {
                    resultItem.status = 'error';
                    resultItem.error = `Invalid role: ${user.role}`;
                    results.push(resultItem);
                    failCount++;
                    continue;
                }
                const role = roleStr as Role;

                // --- Team Handling ---
                let teamId: string | undefined = undefined;

                if (role === 'TEAMLEAD' || (role === 'EMPLOYEE' && user.teamName)) {
                    if (!user.teamName) {
                        resultItem.status = 'error';
                        resultItem.error = 'Team Name required for TEAMLEAD';
                        results.push(resultItem);
                        failCount++;
                        continue;
                    }

                    const teamNameKey = user.teamName.toLowerCase().trim();
                    if (teamCache.has(teamNameKey)) {
                        teamId = teamCache.get(teamNameKey);
                    } else {
                        // Create Team
                        const createRes = await client.query(
                            `INSERT INTO teams (org_id, name, created_at) 
                             VALUES ($1, $2, NOW()) 
                             RETURNING team_id`,
                            [orgId, user.teamName.trim()]
                        );
                        teamId = createRes.rows[0].team_id;
                        teamCache.set(teamNameKey, teamId!);
                    }
                }

                // --- Invite Creation ---
                // Check if already invited (Optional strictness, but let's allow re-invite)

                const inviteToken = createInviteToken({
                    orgId,
                    teamId,
                    role,
                    email: user.email,
                });

                const signature = inviteToken.split('.')[1];

                await client.query(`
                    INSERT INTO active_invites (payload_signature, org_id, created_by, expires_at)
                    VALUES ($1, $2, $3, NOW() + INTERVAL '72 hours')
                    ON CONFLICT (payload_signature) DO NOTHING
                `, [signature, orgId, adminUserId]);

                // --- Email Sending (Best Effort) ---
                // In a real bulk job, this should probably be queued. For 50 it's fine.
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                const inviteLink = `${baseUrl}/invite/accept?token=${inviteToken}`;

                // We won't await email heavily or fail transaction on email fail
                // But generally, we want to know.
                // For speed, let's just log.

                try {
                    await transport.send({
                        to: user.email,
                        subject: 'You are invited to join InPsyq',
                        text: `You have been invited to join InPsyq as ${role}.\n\nClick here to accept: ${inviteLink}`,
                        html: `<p>You have been invited to join InPsyq as <strong>${role}</strong>.</p><p><a href="${inviteLink}">Click here to accept</a></p>`,
                    });
                } catch (e) {
                    console.error('[Bulk Invite] Email failed', e);
                }

                resultItem.status = 'success';
                results.push(resultItem);
                successCount++;
            }

            await client.query('COMMIT');

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        return NextResponse.json({
            ok: true,
            successCount,
            failCount,
            results,
            request_id: requestId,
        });

    } catch (e: any) {
        console.error('[Admin] Import failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: e.message }, request_id: requestId },
            { status: 500 }
        );
    }
}

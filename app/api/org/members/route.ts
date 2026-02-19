/**
 * GET/PATCH /api/org/members
 * 
 * List and update members in the caller's organization.
 * Gated to EXECUTIVE and ADMIN roles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireOrgManagement } from '@/lib/access/guards';
import { query } from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const guardResult = await requireOrgManagement(req);
    if (!guardResult.ok) return guardResult.response;

    const { orgId } = guardResult.value;

    try {
        const result = await query(`
            SELECT 
                u.user_id,
                u.email,
                u.name,
                m.role,
                m.team_id,
                t.name as team_name,
                m.is_active,
                m.created_at
            FROM memberships m
            JOIN users u ON m.user_id = u.user_id
            LEFT JOIN teams t ON m.team_id = t.team_id
            WHERE m.org_id = $1
            ORDER BY m.role DESC, u.email ASC
        `, [orgId]);

        return NextResponse.json({
            ok: true,
            members: result.rows.map(row => ({
                userId: row.user_id,
                email: row.email,
                name: row.name,
                role: row.role,
                teamId: row.team_id,
                teamName: row.team_name,
                isActive: row.is_active,
                createdAt: row.created_at,
            })),
        });
    } catch (e: any) {
        console.error('[Org] GET /members failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch members' } },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    const guardResult = await requireOrgManagement(req);
    if (!guardResult.ok) return guardResult.response;

    const { orgId } = guardResult.value;

    try {
        const body = await req.json();
        const { userId, role, teamId, isActive } = body;

        if (!userId) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'userId is required' } },
                { status: 400 }
            );
        }

        // Verify membership exists
        const existing = await query(
            'SELECT role FROM memberships WHERE user_id = $1 AND org_id = $2',
            [userId, orgId]
        );

        if (existing.rows.length === 0) {
            return NextResponse.json(
                { ok: false, error: { code: 'NOT_FOUND', message: 'User is not a member of this organization' } },
                { status: 404 }
            );
        }

        // Build update dynamically
        const updates: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (role !== undefined) {
            const validRoles = ['EMPLOYEE', 'TEAMLEAD', 'EXECUTIVE', 'ADMIN'];
            if (!validRoles.includes(role)) {
                return NextResponse.json(
                    { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid role' } },
                    { status: 400 }
                );
            }

            // Role-team consistency
            if (role === 'TEAMLEAD' && !teamId) {
                return NextResponse.json(
                    { ok: false, error: { code: 'VALIDATION_ERROR', message: 'TEAMLEAD must have a team' } },
                    { status: 400 }
                );
            }

            // Prevent demoting last admin
            if (existing.rows[0].role === 'ADMIN' && role !== 'ADMIN') {
                const adminCount = await query(
                    'SELECT COUNT(*) as count FROM memberships WHERE org_id = $1 AND role = $2',
                    [orgId, 'ADMIN']
                );
                if (parseInt(adminCount.rows[0].count, 10) <= 1) {
                    return NextResponse.json(
                        { ok: false, error: { code: 'FORBIDDEN', message: 'Cannot remove the last ADMIN' } },
                        { status: 403 }
                    );
                }
            }

            updates.push(`role = $${idx++}`);
            values.push(role);
        }

        if (teamId !== undefined) {
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
            updates.push(`team_id = $${idx++}`);
            values.push(teamId || null);
        }

        if (isActive !== undefined) {
            updates.push(`is_active = $${idx++}`);
            values.push(Boolean(isActive));
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'No updates provided' } },
                { status: 400 }
            );
        }

        values.push(userId, orgId);
        await query(
            `UPDATE memberships SET ${updates.join(', ')} WHERE user_id = $${idx++} AND org_id = $${idx}`,
            values
        );

        return NextResponse.json({ ok: true, message: 'Member updated' });
    } catch (e: any) {
        console.error('[Org] PATCH /members failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update member' } },
            { status: 500 }
        );
    }
}

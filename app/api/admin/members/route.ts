/**
 * GET /api/admin/members
 * 
 * List org members with roles and team assignments.
 * ADMIN only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { query } from '@/db/client';

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
                u.user_id,
                u.email,
                u.name,
                m.role,
                m.team_id,
                t.name as team_name,
                u.created_at,
                u.is_active
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
                createdAt: row.created_at,
                isActive: row.is_active,
            })),
            request_id: requestId,
        });
    } catch (e: any) {
        console.error('[Admin] GET /members failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch members' }, request_id: requestId },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    const requestId = crypto.randomUUID();

    // Admin guard
    const guardResult = await requireAdminStrict(req);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    const { orgId, userId: adminUserId } = guardResult.value;

    try {
        const body = await req.json();
        const { userId, role, teamId } = body;

        // Validate required fields
        if (!userId) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'userId is required' }, request_id: requestId },
                { status: 400 }
            );
        }

        const validRoles = ['EMPLOYEE', 'TEAMLEAD', 'EXECUTIVE', 'ADMIN'];
        if (!role || !validRoles.includes(role)) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'role must be one of: EMPLOYEE, TEAMLEAD, EXECUTIVE, ADMIN' }, request_id: requestId },
                { status: 400 }
            );
        }

        // Enforce role-team consistency rules
        if (role === 'TEAMLEAD' && !teamId) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'TEAMLEAD must have a team_id' }, request_id: requestId },
                { status: 400 }
            );
        }

        if ((role === 'EXECUTIVE' || role === 'ADMIN' || role === 'EMPLOYEE') && teamId) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: `${role} must not have a team_id` }, request_id: requestId },
                { status: 400 }
            );
        }

        // Verify membership exists in this org
        const existingMembership = await query(
            'SELECT role FROM memberships WHERE user_id = $1 AND org_id = $2',
            [userId, orgId]
        );

        if (existingMembership.rows.length === 0) {
            return NextResponse.json(
                { ok: false, error: { code: 'NOT_FOUND', message: 'User is not a member of this organization' }, request_id: requestId },
                { status: 404 }
            );
        }

        // Prevent removing the last ADMIN
        if (existingMembership.rows[0].role === 'ADMIN' && role !== 'ADMIN') {
            const adminCount = await query(
                'SELECT COUNT(*) as count FROM memberships WHERE org_id = $1 AND role = $2',
                [orgId, 'ADMIN']
            );
            if (parseInt(adminCount.rows[0].count, 10) <= 1) {
                return NextResponse.json(
                    { ok: false, error: { code: 'FORBIDDEN', message: 'Cannot remove the last ADMIN from the organization' }, request_id: requestId },
                    { status: 403 }
                );
            }
        }

        // If teamId provided, verify it exists in org
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

        // Update membership
        await query(
            'UPDATE memberships SET role = $1, team_id = $2 WHERE user_id = $3 AND org_id = $4',
            [role, teamId || null, userId, orgId]
        );

        return NextResponse.json({
            ok: true,
            message: 'Member updated successfully',
            request_id: requestId,
        });

    } catch (e: any) {
        console.error('[Admin] PATCH /members failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update member' }, request_id: requestId },
            { status: 500 }
        );
    }
}

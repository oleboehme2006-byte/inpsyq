/**
 * GET/POST/PATCH /api/admin/teams
 * 
 * List, create, and update teams in the organization.
 * ADMIN only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { query } from '@/db/client';

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
                t.team_id,
                t.name,
                t.is_archived,
                t.created_at,
                COUNT(m.user_id) as member_count
            FROM teams t
            LEFT JOIN memberships m ON t.team_id = m.team_id AND m.org_id = t.org_id
            WHERE t.org_id = $1
            GROUP BY t.team_id, t.name, t.is_archived, t.created_at
            ORDER BY t.is_archived ASC, t.name ASC
        `, [orgId]);

        return NextResponse.json({
            ok: true,
            teams: result.rows.map(row => ({
                teamId: row.team_id,
                name: row.name,
                isArchived: row.is_archived || false,
                createdAt: row.created_at,
                memberCount: parseInt(row.member_count, 10),
            })),
            request_id: requestId,
        });
    } catch (e: any) {
        console.error('[Admin] GET /teams failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch teams' }, request_id: requestId },
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

    const { orgId } = guardResult.value;

    try {
        const body = await req.json();
        const { name } = body;

        // Validate name
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Team name must be at least 2 characters' }, request_id: requestId },
                { status: 400 }
            );
        }

        if (name.length > 100) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Team name must be less than 100 characters' }, request_id: requestId },
                { status: 400 }
            );
        }

        // Check uniqueness in org
        const existing = await query(
            'SELECT team_id FROM teams WHERE org_id = $1 AND LOWER(name) = LOWER($2)',
            [orgId, name.trim()]
        );

        if (existing.rows.length > 0) {
            return NextResponse.json(
                { ok: false, error: { code: 'DUPLICATE', message: 'A team with this name already exists' }, request_id: requestId },
                { status: 409 }
            );
        }

        // Create team
        const teamId = crypto.randomUUID();
        await query(
            'INSERT INTO teams (team_id, org_id, name, is_archived, created_at) VALUES ($1, $2, $3, false, NOW())',
            [teamId, orgId, name.trim()]
        );

        return NextResponse.json({
            ok: true,
            teamId,
            message: 'Team created successfully',
            request_id: requestId,
        });

    } catch (e: any) {
        console.error('[Admin] POST /teams failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create team' }, request_id: requestId },
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

    const { orgId } = guardResult.value;

    try {
        const body = await req.json();
        const { teamId, name, isArchived } = body;

        if (!teamId) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'teamId is required' }, request_id: requestId },
                { status: 400 }
            );
        }

        // Verify team belongs to org
        const teamCheck = await query(
            'SELECT team_id FROM teams WHERE team_id = $1 AND org_id = $2',
            [teamId, orgId]
        );

        if (teamCheck.rows.length === 0) {
            return NextResponse.json(
                { ok: false, error: { code: 'NOT_FOUND', message: 'Team not found in this organization' }, request_id: requestId },
                { status: 404 }
            );
        }

        // Build update
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length < 2) {
                return NextResponse.json(
                    { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Team name must be at least 2 characters' }, request_id: requestId },
                    { status: 400 }
                );
            }

            // Check uniqueness if renaming
            const existing = await query(
                'SELECT team_id FROM teams WHERE org_id = $1 AND LOWER(name) = LOWER($2) AND team_id != $3',
                [orgId, name.trim(), teamId]
            );

            if (existing.rows.length > 0) {
                return NextResponse.json(
                    { ok: false, error: { code: 'DUPLICATE', message: 'A team with this name already exists' }, request_id: requestId },
                    { status: 409 }
                );
            }

            updates.push(`name = $${paramIndex++}`);
            values.push(name.trim());
        }

        if (isArchived !== undefined) {
            updates.push(`is_archived = $${paramIndex++}`);
            values.push(Boolean(isArchived));
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'No updates provided' }, request_id: requestId },
                { status: 400 }
            );
        }

        values.push(teamId, orgId);
        await query(
            `UPDATE teams SET ${updates.join(', ')} WHERE team_id = $${paramIndex++} AND org_id = $${paramIndex}`,
            values
        );

        return NextResponse.json({
            ok: true,
            message: 'Team updated successfully',
            request_id: requestId,
        });

    } catch (e: any) {
        console.error('[Admin] PATCH /teams failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update team' }, request_id: requestId },
            { status: 500 }
        );
    }
}

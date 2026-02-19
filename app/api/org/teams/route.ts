/**
 * GET/POST /api/org/teams
 * 
 * List and create teams in the caller's organization.
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
                t.team_id,
                t.name,
                t.is_archived,
                COUNT(m.user_id) as member_count
            FROM teams t
            LEFT JOIN memberships m ON t.team_id = m.team_id AND m.org_id = t.org_id AND m.is_active = true
            WHERE t.org_id = $1
            GROUP BY t.team_id, t.name, t.is_archived
            ORDER BY t.is_archived ASC, t.name ASC
        `, [orgId]);

        return NextResponse.json({
            ok: true,
            teams: result.rows.map(row => ({
                teamId: row.team_id,
                name: row.name,
                isArchived: row.is_archived || false,
                memberCount: parseInt(row.member_count, 10),
            })),
        });
    } catch (e: any) {
        console.error('[Org] GET /teams failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch teams' } },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const guardResult = await requireOrgManagement(req);
    if (!guardResult.ok) return guardResult.response;

    const { orgId } = guardResult.value;

    try {
        const body = await req.json();
        const { name } = body;

        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Team name must be at least 2 characters' } },
                { status: 400 }
            );
        }

        if (name.length > 100) {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Team name must be less than 100 characters' } },
                { status: 400 }
            );
        }

        // Check uniqueness
        const existing = await query(
            'SELECT team_id FROM teams WHERE org_id = $1 AND LOWER(name) = LOWER($2)',
            [orgId, name.trim()]
        );

        if (existing.rows.length > 0) {
            return NextResponse.json(
                { ok: false, error: { code: 'DUPLICATE', message: 'A team with this name already exists' } },
                { status: 409 }
            );
        }

        const teamId = crypto.randomUUID();
        await query(
            'INSERT INTO teams (team_id, org_id, name, is_archived) VALUES ($1, $2, $3, false)',
            [teamId, orgId, name.trim()]
        );

        return NextResponse.json({ ok: true, teamId, message: 'Team created' });
    } catch (e: any) {
        console.error('[Org] POST /teams failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create team' } },
            { status: 500 }
        );
    }
}

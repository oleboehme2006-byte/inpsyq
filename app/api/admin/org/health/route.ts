/**
 * GET /api/admin/org/health
 * 
 * Returns coverage snapshot for the organization.
 * Uses week_offset=-1 to check last completed week (consistent with ops checks).
 * ADMIN only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { getOrgHealthSnapshot } from '@/services/ops/healthSnapshot';
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

    // Get week_offset from query params (default -1 for last completed week)
    const url = new URL(req.url);
    const weekOffset = parseInt(url.searchParams.get('week_offset') || '-1', 10);

    try {
        const snapshot = await getOrgHealthSnapshot(orgId, weekOffset);

        // Get recent submissions count (last 7 days)
        let submissions7d = 0;
        try {
            const submissionsRes = await query(`
                SELECT COUNT(DISTINCT s.session_id) as count
                FROM sessions s
                JOIN memberships m ON s.user_id = m.user_id
                WHERE m.org_id = $1
                AND s.completed_at IS NOT NULL
                AND s.completed_at > NOW() - INTERVAL '7 days'
            `, [orgId]);
            submissions7d = parseInt(submissionsRes.rows[0]?.count || '0', 10);
        } catch (e: any) {
            console.warn('[Health] Failed to count submissions:', e.message);
        }

        return NextResponse.json({
            ok: true,
            health: {
                targetWeekStart: snapshot.weekStart,
                lastUpdatedAt: snapshot.lastUpdatedAt,
                totalTeams: snapshot.teamsTotal,
                okTeams: snapshot.teamsOk,
                degradedTeams: snapshot.teamsDegraded,
                failedTeams: snapshot.teamsFailed,
                missingProducts: snapshot.missingProducts,
                missingInterpretations: snapshot.missingInterpretations,
                locksStuck: snapshot.locksStuck,
                recentFailures: snapshot.recentFailures,
                submissions7d,
            },
            request_id: requestId,
        });
    } catch (e: any) {
        console.error('[Admin] GET /org/health failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch health snapshot' }, request_id: requestId },
            { status: 500 }
        );
    }
}


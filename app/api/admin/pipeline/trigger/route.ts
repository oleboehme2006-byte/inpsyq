/**
 * POST /api/admin/pipeline/trigger
 * 
 * Manually trigger the weekly lineup/aggregation pipeline.
 * ADMIN only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { runWeeklyRollup, rebuildAllForOrg } from '@/services/pipeline/runner';
import { query } from '@/db/client';
import { isValidUUID } from '@/lib/api/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
        const { teamId, weekStart } = body;

        // Option A: Trigger for specific team
        if (teamId) {
            if (!isValidUUID(teamId)) {
                return NextResponse.json(
                    { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid teamId' }, request_id: requestId },
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

            // Default to current week if not provided
            let weekDate = new Date();
            if (weekStart) {
                weekDate = new Date(weekStart);
                if (isNaN(weekDate.getTime())) {
                    return NextResponse.json(
                        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid weekStart date' }, request_id: requestId },
                        { status: 400 }
                    );
                }
            }

            console.log(`[API] Triggering pipeline for Team ${teamId} Week ${weekDate.toISOString()}`);
            const result = await runWeeklyRollup(orgId, teamId, weekDate);

            return NextResponse.json({
                ok: true,
                scope: 'team',
                result,
                request_id: requestId,
            });
        }

        // Option B: Rebuild all for org
        // This is a heavier operation, might timeout if too many teams.
        console.log(`[API] Triggering full rebuild for Org ${orgId}`);
        const result = await rebuildAllForOrg(orgId, 9); // Default to 9 weeks back

        return NextResponse.json({
            ok: true,
            scope: 'org',
            result,
            request_id: requestId,
        });

    } catch (e: any) {
        console.error('[Admin] POST /pipeline/trigger failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Pipeline execution failed: ' + e.message }, request_id: requestId },
            { status: 500 }
        );
    }
}

/**
 * PIPELINE DIAGNOSTICS — View Pipeline Status
 * 
 * GET /api/internal/diag/pipeline
 * Guarded: ADMIN only in production, dev header in development.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';
import { requireInternalAccess } from '@/lib/access/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const requestId = crypto.randomUUID();

    // Guard: internal access required
    const guardResult = await requireInternalAccess(req);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    try {
        const url = new URL(req.url);
        const orgId = url.searchParams.get('org_id');
        const teamId = url.searchParams.get('team_id');

        // Build query based on filters
        let sql = `
      SELECT 
        org_id, team_id, week_start, 
        compute_version, input_hash, updated_at
      FROM org_aggregates_weekly
      WHERE 1=1
    `;
        const params: any[] = [];
        let paramIdx = 1;

        if (orgId) {
            sql += ` AND org_id = $${paramIdx++}`;
            params.push(orgId);
        }
        if (teamId) {
            sql += ` AND team_id = $${paramIdx++}`;
            params.push(teamId);
        }

        sql += ` ORDER BY week_start DESC LIMIT 50`;

        const result = await query(sql, params);

        // Get latest week
        const latestWeekStart = result.rows[0]?.week_start || null;

        // Format rows
        const rows = result.rows.map(r => ({
            week_start: r.week_start,
            compute_version: r.compute_version || 'legacy',
            input_hash: r.input_hash || null,
            updated_at: r.updated_at,
        }));

        return NextResponse.json({
            request_id: requestId,
            org_id: orgId || 'all',
            team_id: teamId || 'all',
            latest_week_start: latestWeekStart,
            rows,
            counts: {
                weeks: rows.length,
            },
        });

    } catch (error: any) {
        console.error('[API] /internal/diag/pipeline failed:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

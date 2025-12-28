/**
 * DASHBOARD READY DIAGNOSTICS — Check Dashboard Data Availability
 * 
 * GET /api/internal/diag/dashboard-ready?org_id=...&team_id=...
 * Returns data availability status for dashboards.
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

        if (!orgId) {
            return NextResponse.json(
                { error: 'org_id is required', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        // Build query
        let sql = `
      SELECT 
        COUNT(*) as weeks_available,
        MAX(week_start) as latest_week,
        COUNT(CASE WHEN attribution IS NOT NULL AND attribution::text != '[]' THEN 1 END) as has_attribution_count,
        COUNT(CASE WHEN series IS NOT NULL THEN 1 END) as has_series_count,
        COUNT(CASE WHEN input_hash IS NOT NULL THEN 1 END) as has_hash_count
      FROM org_aggregates_weekly
      WHERE org_id = $1
    `;
        const params: any[] = [orgId];

        if (teamId) {
            sql += ` AND team_id = $2`;
            params.push(teamId);
        }

        const result = await query(sql, params);
        const row = result.rows[0];

        const weeksAvailable = parseInt(row.weeks_available || '0');
        const latestWeek = row.latest_week ? new Date(row.latest_week).toISOString().slice(0, 10) : null;
        const hasAttributionCount = parseInt(row.has_attribution_count || '0');
        const hasSeriesCount = parseInt(row.has_series_count || '0');
        const hasHashCount = parseInt(row.has_hash_count || '0');

        // Determine missing fields
        const missingFields: string[] = [];
        if (weeksAvailable === 0) missingFields.push('no_weekly_products');
        if (hasAttributionCount === 0 && weeksAvailable > 0) missingFields.push('no_attribution');
        if (hasSeriesCount === 0 && weeksAvailable > 0) missingFields.push('no_series');
        if (hasHashCount === 0 && weeksAvailable > 0) missingFields.push('no_input_hash');

        return NextResponse.json({
            request_id: requestId,
            org_id: orgId,
            team_id: teamId || 'all',
            weeks_available: weeksAvailable,
            latest_week: latestWeek,
            has_attribution: hasAttributionCount > 0,
            has_series: hasSeriesCount > 0,
            has_input_hash: hasHashCount > 0,
            missing_fields: missingFields,
            ready: missingFields.length === 0 && weeksAvailable >= 1,
        });

    } catch (error: any) {
        console.error('[API] /internal/diag/dashboard-ready failed:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

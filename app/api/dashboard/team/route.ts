/**
 * TEAM DASHBOARD API — Guarded Read Endpoint
 * 
 * GET /api/dashboard/team?org_id=...&team_id=...&weeks=9
 * Guard: TEAMLEAD (team-scoped) or ADMIN
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTeamDashboardData } from '@/services/dashboard/teamReader';
import { requireTeamAccess } from '@/lib/access/guards';
import { buildCacheKey, getFromCache, setCache, isCacheValid } from '@/services/dashboard/cache';
import { measure } from '@/lib/diagnostics/timing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
        const url = new URL(req.url);
        const orgId = url.searchParams.get('org_id');
        const teamId = url.searchParams.get('team_id');
        const weeks = parseInt(url.searchParams.get('weeks') || '9');

        // Validate required params
        if (!orgId || !teamId) {
            return NextResponse.json(
                { error: 'org_id and team_id are required', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        // Guard: require team access
        const guardResult = await requireTeamAccess(req, teamId);
        if (!guardResult.ok) {
            return guardResult.response;
        }

        // Check cache
        // Check cache (Verify hash first for strict correctness)
        // Check cache with correct hash
        const { valid, currentHash } = await isCacheValid(orgId, teamId, 'latest');
        const computedHash = currentHash || 'none';
        const cacheKey = buildCacheKey('team', orgId, teamId, 'latest', 'v2', computedHash);

        const cached = getFromCache<any>(cacheKey);
        if (cached && valid) {
            return NextResponse.json({
                ...cached.data,
                meta: {
                    ...cached.data.meta,
                    cacheHit: true,
                    request_id: requestId,
                    duration_ms: Date.now() - startTime,
                },
            });
        }

        // Fetch fresh data
        const data = await measure('dashboard.team.read', () =>
            getTeamDashboardData(orgId, teamId, weeks)
        );

        if (!data) {
            return NextResponse.json({
                error: 'No data available for this team',
                code: 'NO_DATA',
                status: 'FAILED',
                request_id: requestId,
                suggestion: 'Run pipeline:dev:rebuild to generate weekly products',
            }, { status: 404 });
        }

        // Check interpretation status for "Staleness/Degraded" check
        // We do this AFTER fetching data to avoid overhead if no data
        // We import query locally or use a lightweight check
        // For simplicity, we assume "DEGRADED" if no active interpretation
        // We'll perform a quick DB check. 
        // Note: This adds a query. But for "Operational Visibility" it's required.
        // We can optimize by joining in teamReader later if needed.
        const { rows: interpRows } = await import('@/db/client').then(m => m.query(
            `SELECT created_at FROM weekly_interpretations 
             WHERE org_id = $1 AND team_id = $2 AND week_start = $3 AND is_active = true`,
            [orgId, teamId, data.meta.latestWeek]
        ));

        const interpretationExists = interpRows.length > 0;
        const status = interpretationExists ? 'OK' : 'DEGRADED';

        if (interpretationExists) {
            data.meta.lastInterpretationAt = new Date(interpRows[0].created_at).toISOString();
        }

        const responseData = {
            ...data,
            status, // Top-level status
            meta: {
                ...data.meta,
                request_id: requestId,
                duration_ms: Date.now() - startTime,
            }
        };

        // Cache result
        setCache(cacheKey, responseData, data.meta.latestWeek);

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('[API] /dashboard/team failed:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

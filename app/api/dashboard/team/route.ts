/**
 * TEAM DASHBOARD API — Guarded Read Endpoint
 * 
 * GET /api/dashboard/team?org_id=...&team_id=...&weeks=9
 * Guard: TEAMLEAD (team-scoped) or ADMIN
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTeamDashboardData } from '@/services/dashboard/teamReader';
import { requireTeamAccess } from '@/lib/access/guards';
import { buildCacheKey, getFromCache, setCache } from '@/services/dashboard/cache';

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
        const cacheKey = buildCacheKey('team', orgId, teamId, 'latest', 'v2');
        const cached = getFromCache<any>(cacheKey);
        if (cached) {
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
        const data = await getTeamDashboardData(orgId, teamId, weeks);

        if (!data) {
            return NextResponse.json({
                error: 'No data available for this team',
                code: 'NO_DATA',
                request_id: requestId,
                suggestion: 'Run pipeline:dev:rebuild to generate weekly products',
            }, { status: 404 });
        }

        // Cache result
        setCache(cacheKey, data, data.meta.latestWeek);

        return NextResponse.json({
            ...data,
            meta: {
                ...data.meta,
                request_id: requestId,
                duration_ms: Date.now() - startTime,
            },
        });

    } catch (error: any) {
        console.error('[API] /dashboard/team failed:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

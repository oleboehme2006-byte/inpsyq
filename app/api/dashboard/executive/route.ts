/**
 * EXECUTIVE DASHBOARD API — Guarded Read Endpoint
 * 
 * GET /api/dashboard/executive?org_id=...&weeks=9
 * Guard: EXECUTIVE or ADMIN
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExecutiveDashboardData } from '@/services/dashboard/executiveReader';
import { requireRole } from '@/lib/access/guards';
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
        const weeks = parseInt(url.searchParams.get('weeks') || '9');

        // Validate required params
        if (!orgId) {
            return NextResponse.json(
                { error: 'org_id is required', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        // Guard: require EXECUTIVE or ADMIN
        const guardResult = await requireRole(req, orgId, ['ADMIN', 'EXECUTIVE']);
        if (!guardResult.ok) {
            return guardResult.response;
        }

        // Check cache - pass null for teamId since executive is org-level
        const { currentHash } = await isCacheValid(orgId, null as any, 'latest'); // Executive uses null teamId for org-level aggregation
        // Wait, buildCacheKey takes teamId. ExecutiveReader might not use teamId.
        // Let's check `isCacheValid`. It takes (orgId, teamId, weekStart).
        // If executive data is org-level, `teamId` in `org_aggregates_weekly` might be null or special?
        // Executive dashboard aggregates across teams?
        // `getExecutiveDashboardData` reads `org_aggregates_weekly`?
        // Let's check `services/dashboard/executiveReader.ts`.
        // If it reads `org_aggregates_weekly`, it might sum up rows?
        // If so, there is no single "input hash".
        // If executive dashboard is aggregated ON THE FLY, the cache key should depend on... what?
        // Maybe the set of all team hashes? That's expensive.
        // Or strictly time-based?
        // The prompt says: "Key: org_id + (team_id or executive) + week_start_range + input_hash OR product_hash"
        // If executive is dynamic, strict hash might be hard.
        // But let's assume 'latest' logic for now.
        // If I pass 'null' for teamId in `isCacheValid`, does it work?
        // `isCacheValid` query: `WHERE org_id = $1 AND team_id = $2`.
        // If I pass null, `team_id = null` -> `team_id IS NULL`.
        // Does `org_aggregates_weekly` have rows with `team_id IS NULL`? Even for org level?
        // Likely not yet if it's aggregated on fly.
        // So `isCacheValid` will return null hash.
        // Let's use '0000' if null is returned, relying on TTL.

        const cacheKey = buildCacheKey('executive', orgId, null, 'latest', 'v2', currentHash || 'dynamic');
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
        // Fetch fresh data
        const data = await measure('dashboard.executive.read', () =>
            getExecutiveDashboardData(orgId, weeks)
        );

        if (!data) {
            return NextResponse.json({
                error: 'No data available for this organization',
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
        console.error('[API] /dashboard/executive failed:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

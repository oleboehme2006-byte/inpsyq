/**
 * EXECUTIVE DASHBOARD API — Guarded Read Endpoint
 * 
 * GET /api/dashboard/executive?org_id=...&weeks=9
 * Guard: EXECUTIVE or ADMIN
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExecutiveDashboardData } from '@/services/dashboard/executiveReader';
import { requireRole } from '@/lib/access/guards';
import { buildCacheKey, getFromCache, setCache } from '@/services/dashboard/cache';

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

        // Check cache
        const cacheKey = buildCacheKey('executive', orgId, null, 'latest', 'v2');
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
        const data = await getExecutiveDashboardData(orgId, weeks);

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

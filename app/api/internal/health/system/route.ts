/**
 * GET /api/internal/health/system
 * 
 * Comprehensive system health endpoint.
 * Returns DB connectivity, pipeline freshness, coverage, and stuck locks.
 * Requires INTERNAL_ADMIN_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Verify secret
    const authHeader = req.headers.get('authorization');
    const expected = process.env.INTERNAL_ADMIN_SECRET;

    if (!expected || authHeader !== `Bearer ${expected}`) {
        return NextResponse.json(
            { ok: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const health: Record<string, any> = {
        timestamp: new Date().toISOString(),
        environment: process.env.APP_ENV || process.env.NODE_ENV || 'unknown',
    };

    // 1. DB connectivity
    try {
        const dbStart = Date.now();
        await query('SELECT 1');
        health.database = {
            ok: true,
            latency_ms: Date.now() - dbStart,
        };
    } catch (e: any) {
        health.database = {
            ok: false,
            error: e.message,
        };
    }

    // 2. Weekly pipeline freshness
    try {
        const weeklyRes = await query(`
            SELECT week_start, created_at
            FROM weekly_products
            ORDER BY week_start DESC
            LIMIT 1
        `);

        if (weeklyRes.rows.length > 0) {
            const lastWeek = weeklyRes.rows[0];
            const weekStart = new Date(lastWeek.week_start);
            const now = new Date();
            const daysSinceWeekStart = (now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24);

            health.pipeline = {
                ok: daysSinceWeekStart < 14,
                lastWeekStart: lastWeek.week_start,
                lastRunAt: lastWeek.created_at,
                daysSinceWeekStart: Math.round(daysSinceWeekStart),
            };
        } else {
            health.pipeline = {
                ok: false,
                note: 'No weekly products found',
            };
        }
    } catch (e: any) {
        health.pipeline = {
            ok: false,
            error: e.message,
        };
    }

    // 3. Interpretation coverage
    try {
        const coverageRes = await query(`
            SELECT 
                COUNT(DISTINCT wp.team_id) as total_products,
                COUNT(DISTINCT wi.team_id) as with_interpretations
            FROM weekly_products wp
            LEFT JOIN weekly_interpretations wi 
                ON wp.team_id = wi.team_id 
                AND wp.week_start = wi.week_start
            WHERE wp.week_start = (
                SELECT MAX(week_start) FROM weekly_products
            )
        `);

        const row = coverageRes.rows[0];
        const total = parseInt(row?.total_products || '0', 10);
        const withInterp = parseInt(row?.with_interpretations || '0', 10);

        health.interpretations = {
            ok: total === 0 || withInterp === total,
            total: total,
            withInterpretations: withInterp,
            coverage: total > 0 ? Math.round((withInterp / total) * 100) : 100,
        };
    } catch (e: any) {
        health.interpretations = {
            ok: false,
            error: e.message,
        };
    }

    // 4. Stuck locks
    try {
        const locksRes = await query(`
            SELECT COUNT(*) as count
            FROM weekly_locks
            WHERE locked_at < NOW() - INTERVAL '1 hour'
            AND completed_at IS NULL
        `);

        const stuckCount = parseInt(locksRes.rows[0]?.count || '0', 10);
        health.locks = {
            ok: stuckCount === 0,
            stuckCount,
        };
    } catch (e: any) {
        health.locks = {
            ok: false,
            error: e.message,
        };
    }

    // 5. Retention status
    try {
        const { getRetentionStatus } = await import('@/lib/security/retention');
        const retentionStatus = await getRetentionStatus();

        health.retention = {
            ok: !retentionStatus.overdue,
            lastRunAt: retentionStatus.lastRunAt,
            overdue: retentionStatus.overdue,
            maxAgeHours: retentionStatus.maxAgeHours,
        };
    } catch (e: any) {
        health.retention = {
            ok: true,
            note: 'Unable to check retention status',
        };
    }

    // Overall status
    const allOk = health.database?.ok &&
        health.pipeline?.ok &&
        health.interpretations?.ok &&
        health.locks?.ok;

    return NextResponse.json({
        ok: allOk,
        health,
    });
}

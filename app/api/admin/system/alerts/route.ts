/**
 * GET /api/admin/system/alerts
 * 
 * Returns alerts/incidents for the organization.
 * ADMIN only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminStrict } from '@/lib/access/guards';
import { query } from '@/db/client';
import { getOrgHealthSnapshot } from '@/services/ops/healthSnapshot';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const requestId = crypto.randomUUID();

    // Admin guard
    const guardResult = await requireAdminStrict(req);
    if (!guardResult.ok) {
        return guardResult.response;
    }

    const { orgId } = guardResult.value;

    // Get limit from query params
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 200);

    try {
        // Try to get stored alerts first
        let storedAlerts: any[] = [];
        let hasStoredAlerts = false;

        try {
            const result = await query(`
                SELECT 
                    alert_id,
                    alert_type,
                    severity,
                    message,
                    target_week_start,
                    details,
                    created_at,
                    resolved_at
                FROM alerts
                WHERE org_id = $1
                ORDER BY created_at DESC
                LIMIT $2
            `, [orgId, limit]);
            storedAlerts = result.rows;
            hasStoredAlerts = true;
        } catch (tableError: any) {
            // alerts table might not exist
            if (!tableError.message.includes('does not exist')) {
                throw tableError;
            }
        }

        // Compute current alert state from health snapshot
        const snapshot = await getOrgHealthSnapshot(orgId, -1);
        const computedAlerts: any[] = [];

        // Check for COVERAGE_GAP
        if (snapshot.teamsTotal > 0) {
            const failureRate = snapshot.teamsFailed / snapshot.teamsTotal;
            if (failureRate > 0.1) {
                computedAlerts.push({
                    alertId: `computed-coverage-gap`,
                    alertType: 'COVERAGE_GAP',
                    severity: 'critical',
                    message: `High coverage gap: ${(failureRate * 100).toFixed(1)}% teams failed/missing products`,
                    targetWeekStart: snapshot.weekStart,
                    details: {
                        totalTeams: snapshot.teamsTotal,
                        failedTeams: snapshot.teamsFailed,
                        missingProducts: snapshot.missingProducts,
                    },
                    computedAt: new Date().toISOString(),
                    isComputed: true,
                });
            }
        }

        // Check for stuck locks
        if (snapshot.locksStuck > 0) {
            computedAlerts.push({
                alertId: `computed-locks-stuck`,
                alertType: 'LOCK_STUCK',
                severity: 'warning',
                message: `${snapshot.locksStuck} teams have stuck locks > 30m`,
                targetWeekStart: snapshot.weekStart,
                computedAt: new Date().toISOString(),
                isComputed: true,
            });
        }

        // Check for degraded interpretations
        if (snapshot.teamsDegraded > 0) {
            computedAlerts.push({
                alertId: `computed-degraded`,
                alertType: 'INTERPRETATION_FALLBACK_HIGH',
                severity: 'warning',
                message: `${snapshot.teamsDegraded} teams have degraded interpretation status`,
                targetWeekStart: snapshot.weekStart,
                computedAt: new Date().toISOString(),
                isComputed: true,
            });
        }

        return NextResponse.json({
            ok: true,
            hasStoredAlerts,
            storedAlerts: storedAlerts.map(row => ({
                alertId: row.alert_id,
                alertType: row.alert_type,
                severity: row.severity,
                message: row.message,
                targetWeekStart: row.target_week_start,
                details: row.details,
                createdAt: row.created_at,
                resolvedAt: row.resolved_at,
                isComputed: false,
            })),
            computedAlerts,
            request_id: requestId,
        });
    } catch (e: any) {
        console.error('[Admin] GET /system/alerts failed:', e.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch alerts' }, request_id: requestId },
            { status: 500 }
        );
    }
}

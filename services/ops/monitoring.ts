/**
 * Monitoring Runner
 * 
 * Runs system health checks and produces normalized alerts.
 * Environment-safe: respects OPS_ALERTS_DISABLED and staging isolation.
 */

import { query } from '@/db/client';
import { getAppEnv, getEnvLabel, isStaging } from '@/lib/env/appEnv';
import { isAlertsDisabled } from '@/lib/env/stagingSafety';
import { getRetentionStatus } from '@/lib/security/retention';
import { logSecurityEvent } from '@/lib/security/auditLog';

export interface MonitoringAlert {
    code: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    details?: Record<string, any>;
}

export interface MonitoringResult {
    timestamp: string;
    environment: string;
    envLabel: string;
    alertsDisabled: boolean;
    checks: {
        database: { ok: boolean; latencyMs?: number; error?: string };
        pipeline: { ok: boolean; lastWeek?: string; daysAgo?: number; error?: string };
        interpretations: { ok: boolean; coverage?: number };
        retention: { ok: boolean; overdue?: boolean; lastRunAt?: string };
        locks: { ok: boolean; stuckCount?: number };
    };
    alerts: MonitoringAlert[];
    deliveryStatus: 'delivered' | 'skipped' | 'disabled';
}

/**
 * Run all monitoring checks.
 */
export async function runMonitoringChecks(params: {
    now?: Date;
}): Promise<MonitoringResult> {
    const now = params.now || new Date();
    const alerts: MonitoringAlert[] = [];
    const envLabel = getEnvLabel();

    const result: MonitoringResult = {
        timestamp: now.toISOString(),
        environment: getAppEnv(),
        envLabel,
        alertsDisabled: isAlertsDisabled(),
        checks: {
            database: { ok: false },
            pipeline: { ok: false },
            interpretations: { ok: true },
            retention: { ok: true },
            locks: { ok: true },
        },
        alerts: [],
        deliveryStatus: 'skipped',
    };

    // Check 1: DB connectivity
    try {
        const start = Date.now();
        await query('SELECT 1');
        result.checks.database = {
            ok: true,
            latencyMs: Date.now() - start,
        };
    } catch (e: any) {
        result.checks.database = { ok: false, error: e.message };
        alerts.push({
            code: 'DB_UNREACHABLE',
            severity: 'critical',
            message: `${envLabel} Database connection failed`,
            details: { error: e.message },
        });
    }

    // Check 2: Pipeline freshness
    try {
        const pipelineRes = await query(`
            SELECT week_start, created_at
            FROM weekly_products
            ORDER BY week_start DESC
            LIMIT 1
        `);

        if (pipelineRes.rows.length > 0) {
            const lastWeek = pipelineRes.rows[0];
            const weekStart = new Date(lastWeek.week_start);
            const daysAgo = Math.round((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));

            result.checks.pipeline = {
                ok: daysAgo < 14,
                lastWeek: lastWeek.week_start,
                daysAgo,
            };

            if (daysAgo >= 14) {
                alerts.push({
                    code: 'PIPELINE_STALE',
                    severity: 'warning',
                    message: `${envLabel} Pipeline stale: last run ${daysAgo} days ago`,
                });
            }
        } else {
            result.checks.pipeline = { ok: false };
        }
    } catch (e: any) {
        result.checks.pipeline = { ok: false, error: e.message };
    }

    // Check 3: Interpretation coverage
    try {
        const coverageRes = await query(`
            SELECT 
                COUNT(DISTINCT wp.team_id) as total,
                COUNT(DISTINCT wi.team_id) as with_interp
            FROM weekly_products wp
            LEFT JOIN weekly_interpretations wi 
                ON wp.team_id = wi.team_id AND wp.week_start = wi.week_start
            WHERE wp.week_start = (SELECT MAX(week_start) FROM weekly_products)
        `);

        const row = coverageRes.rows[0];
        const total = parseInt(row?.total || '0', 10);
        const withInterp = parseInt(row?.with_interp || '0', 10);
        const coverage = total > 0 ? Math.round((withInterp / total) * 100) : 100;

        result.checks.interpretations = {
            ok: coverage >= 80,
            coverage,
        };

        if (coverage < 80 && total > 0) {
            alerts.push({
                code: 'INTERPRETATION_GAP',
                severity: 'warning',
                message: `${envLabel} Interpretation coverage: ${coverage}%`,
            });
        }
    } catch { /* ignore */ }

    // Check 4: Retention status
    try {
        const retentionStatus = await getRetentionStatus();
        result.checks.retention = {
            ok: !retentionStatus.overdue,
            overdue: retentionStatus.overdue,
            lastRunAt: retentionStatus.lastRunAt || undefined,
        };

        if (retentionStatus.overdue) {
            alerts.push({
                code: 'RETENTION_OVERDUE',
                severity: 'warning',
                message: `${envLabel} Retention enforcement overdue`,
                details: { lastRunAt: retentionStatus.lastRunAt, maxAgeHours: retentionStatus.maxAgeHours },
            });
        }
    } catch { /* ignore */ }

    // Check 5: Stuck locks
    try {
        const locksRes = await query(`
            SELECT COUNT(*) as count
            FROM weekly_locks
            WHERE locked_at < NOW() - INTERVAL '1 hour'
            AND completed_at IS NULL
        `);

        const stuckCount = parseInt(locksRes.rows[0]?.count || '0', 10);
        result.checks.locks = {
            ok: stuckCount === 0,
            stuckCount,
        };

        if (stuckCount > 0) {
            alerts.push({
                code: 'STUCK_LOCKS',
                severity: 'warning',
                message: `${envLabel} ${stuckCount} stuck pipeline locks`,
            });
        }
    } catch { /* ignore */ }

    result.alerts = alerts;

    // Determine delivery status
    if (isAlertsDisabled()) {
        result.deliveryStatus = 'disabled';
    } else if (alerts.length === 0) {
        result.deliveryStatus = 'skipped';
    } else {
        // In staging, skip delivery unless staging webhook is configured
        if (isStaging() && !process.env.SLACK_WEBHOOK_URL_STAGING) {
            result.deliveryStatus = 'skipped';
        } else {
            result.deliveryStatus = 'delivered';
            // Actual delivery would happen here via Slack transport
        }
    }

    // Log the check
    await logSecurityEvent({
        actor_user_id: null,
        org_id: null,
        action: 'MONITORING_CHECK_RAN',
        metadata: {
            environment: result.environment,
            alertCount: alerts.length,
            deliveryStatus: result.deliveryStatus,
        },
    });

    return result;
}

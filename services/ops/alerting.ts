/**
 * Alerting Service
 * 
 * Handles alert dispatch with dedupe, rate limiting, and transport abstraction.
 */

import { getGlobalHealthSnapshot } from './healthSnapshot';
import { getActiveTransport, AlertMessage } from './transport';

// In-memory dedupe cache
const alertCache = new Map<string, number>();
const DEDUPE_MS = 30 * 60 * 1000; // 30 minutes

export type AlertType =
    | 'WEEKLY_RUN_FAILED'
    | 'LOCK_STUCK'
    | 'COVERAGE_GAP'
    | 'INTERPRETATION_FALLBACK_HIGH'
    | 'TEST_ALERT';

export interface AlertPayload {
    type: AlertType;
    severity: 'critical' | 'warning' | 'info';
    summary: string;
    details?: any;
    orgId?: string;
    teamId?: string;
    weekLabel?: string;
}

/**
 * Get action hint for alert type.
 */
function getActionHint(type: AlertType): string {
    switch (type) {
        case 'WEEKLY_RUN_FAILED':
            return 'Check /api/internal/ops/incidents for details. Re-run with week_offset if needed.';
        case 'LOCK_STUCK':
            return 'Run: npx tsx scripts/release_stale_locks.ts --confirm';
        case 'COVERAGE_GAP':
            return 'Check weekly runner cron. Run manual backfill with week_offset: -1';
        case 'INTERPRETATION_FALLBACK_HIGH':
            return 'Check LLM provider status or increase token budget.';
        case 'TEST_ALERT':
            return 'This is a test alert. No action required.';
        default:
            return 'Check /api/internal/ops/health/global for system status.';
    }
}

/**
 * Send an alert via the configured transport.
 * Returns true if sent, false if suppressed (dedupe) or failed.
 */
export async function sendAlert(payload: AlertPayload): Promise<boolean> {
    // Dedupe check
    const dedupKey = `${payload.type}:${payload.orgId || 'global'}:${payload.summary}`;
    const now = Date.now();
    const lastSent = alertCache.get(dedupKey);

    if (lastSent && (now - lastSent < DEDUPE_MS)) {
        console.log('[Alerting] Suppressing duplicate alert:', dedupKey);
        return false;
    }

    const transport = getActiveTransport();

    const message: AlertMessage = {
        type: payload.type,
        severity: payload.severity,
        summary: payload.summary,
        orgId: payload.orgId,
        teamId: payload.teamId,
        weekLabel: payload.weekLabel,
        actionHint: getActionHint(payload.type),
        timestamp: new Date().toISOString(),
    };

    const result = await transport.send(message);

    if (result.ok) {
        alertCache.set(dedupKey, now);
        console.log(`[Alerting] Alert sent via ${transport.name}:`, payload.summary);
        return true;
    } else {
        console.error(`[Alerting] Failed to send via ${transport.name}:`, result.error);
        return false;
    }
}

/**
 * Clear the dedupe cache (for testing).
 */
export function clearAlertCache(): void {
    alertCache.clear();
}

/**
 * Check system state and emit alerts if needed.
 * Intended to be run periodically (e.g., hourly cron).
 * 
 * IMPORTANT: Checks the PREVIOUS COMPLETED week (week_offset=-1),
 * not the current week in progress. The weekly runner runs Monday AM
 * and produces data for the previous week, so we check that.
 */
export async function checkSystemAlerts(): Promise<{ checked: boolean; alertsSent: number }> {
    // Check PREVIOUS week (the most recent completed week)
    // This is critical: weekly runner produces data for week -1, not week 0
    const snapshot = await getGlobalHealthSnapshot(-1);
    let alertsSent = 0;

    // 1. Coverage Gaps
    const totalTeams = snapshot.totalTeams;
    if (totalTeams > 0) {
        const failureRate = snapshot.totalFailed / totalTeams;
        if (failureRate > 0.1) { // > 10% failure
            const sent = await sendAlert({
                type: 'COVERAGE_GAP',
                severity: 'critical',
                summary: `High coverage gap: ${(failureRate * 100).toFixed(1)}% teams failed/missing products`,
                weekLabel: snapshot.weekStart,
                details: {
                    target_week_start: snapshot.weekStart,
                    total_teams: totalTeams,
                    missing_teams: snapshot.totalFailed,
                    degraded_teams: snapshot.totalDegraded,
                    ok_teams: snapshot.totalOk,
                    missing_products: snapshot.globalIssues.missingProducts,
                    missing_interpretations: snapshot.globalIssues.missingInterpretations,
                }
            });
            if (sent) alertsSent++;
        }
    }

    // 2. Stuck locks
    if (snapshot.globalIssues.locksStuck > 0) {
        const sent = await sendAlert({
            type: 'LOCK_STUCK',
            severity: 'warning',
            summary: `${snapshot.globalIssues.locksStuck} teams have stuck locks > 30m`,
        });
        if (sent) alertsSent++;
    }

    // 3. Degraded (missing interpretations)
    if (snapshot.totalDegraded > 0) {
        const sent = await sendAlert({
            type: 'INTERPRETATION_FALLBACK_HIGH',
            severity: 'warning',
            summary: `${snapshot.totalDegraded} teams have degraded interpretation status`,
        });
        if (sent) alertsSent++;
    }

    return { checked: true, alertsSent };
}

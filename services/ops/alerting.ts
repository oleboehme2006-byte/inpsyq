
import { getGlobalHealthSnapshot } from './healthSnapshot';

// Simple in-memory dedupe for dev/demo. In prod, use Redis or DB.
const alertCache = new Map<string, number>();
const DEDUPE_MS = 30 * 60 * 1000; // 30 minutes

export interface AlertPayload {
    type: 'WEEKLY_RUN_FAILED' | 'LOCK_STUCK' | 'COVERAGE_GAP' | 'INTERPRETATION_FALLBACK_HIGH';
    severity: 'critical' | 'warning' | 'info';
    summary: string;
    details?: any;
    orgId?: string;
}

/**
 * Send an alert to the configured webhook.
 */
export async function sendAlert(payload: AlertPayload): Promise<boolean> {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn('[Alerting] No ALERT_WEBHOOK_URL configured. Alert suppressed:', payload.summary);
        return false;
    }

    // Dedupe
    const dedupKey = `${payload.type}:${payload.orgId || 'global'}:${payload.summary}`;
    const now = Date.now();
    const lastSent = alertCache.get(dedupKey);

    if (lastSent && (now - lastSent < DEDUPE_MS)) {
        console.log('[Alerting] Suppressing duplicate alert:', dedupKey);
        return false;
    }

    try {
        const body = {
            env: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            ...payload
        };

        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            console.error('[Alerting] Webhook failed:', res.status, res.statusText);
            return false;
        }

        alertCache.set(dedupKey, now);
        console.log('[Alerting] Alert sent:', payload.summary);
        return true;
    } catch (e) {
        console.error('[Alerting] Dispatch error:', e);
        return false;
    }
}

/**
 * Check system state and emit alerts if needed.
 * Intended to be run periodically (e.g. hourly cron).
 */
export async function checkSystemAlerts(): Promise<void> {
    const snapshot = await getGlobalHealthSnapshot(0); // Current week

    // 1. Coverage Gaps
    const totalTeams = snapshot.totalTeams;
    if (totalTeams > 0) {
        const failureRate = snapshot.totalFailed / totalTeams;
        if (failureRate > 0.1) { // > 10% failure
            await sendAlert({
                type: 'COVERAGE_GAP',
                severity: 'critical',
                summary: `High coverage gap: ${(failureRate * 100).toFixed(1)}% teams failed/missing products`,
                details: { failed: snapshot.totalFailed, total: totalTeams }
            });
        }
    }

    // 2. Monitoring stuck locks
    if (snapshot.globalIssues.locksStuck > 0) {
        await sendAlert({
            type: 'LOCK_STUCK',
            severity: 'warning',
            summary: `${snapshot.globalIssues.locksStuck} teams have stuck locks > 30m`,
            details: { count: snapshot.globalIssues.locksStuck }
        });
    }

    // 3. Fallback Rates (Interpretations)
    // snapshot.totalDegraded counts teams with product but missing active interpretation
    if (snapshot.totalDegraded > 0) {
        await sendAlert({
            type: 'INTERPRETATION_FALLBACK_HIGH',
            severity: 'warning',
            summary: `${snapshot.totalDegraded} teams have degraded interpretation status`,
            details: { degraded: snapshot.totalDegraded }
        });
    }
}

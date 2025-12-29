/**
 * ALERT WEBHOOK SERVICE
 * 
 * Sends alerts to external webhook on run failures.
 */

const WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;

export interface AlertPayload {
    env: string;
    run_id: string;
    week_start: string;
    status: string;
    counts: {
        orgs_total: number;
        orgs_success: number;
        orgs_failed: number;
        teams_total: number;
        teams_success: number;
        teams_failed: number;
    };
    top_error?: string;
    timestamp: string;
}

/**
 * Send alert to configured webhook.
 * Never throws - failures are logged.
 */
export async function sendAlert(payload: AlertPayload): Promise<boolean> {
    if (!WEBHOOK_URL) {
        console.log('[alert] No ALERT_WEBHOOK_URL configured, skipping alert');
        return false;
    }

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('[alert] Webhook returned non-OK:', response.status);
            return false;
        }

        console.log('[alert] Alert sent successfully');
        return true;
    } catch (e: any) {
        console.error('[alert] Failed to send alert:', e.message);
        return false;
    }
}

/**
 * Send failure alert for a weekly run.
 */
export async function sendRunFailureAlert(params: {
    runId: string;
    weekStart: string;
    status: string;
    counts: AlertPayload['counts'];
    topError?: string;
}): Promise<boolean> {
    const payload: AlertPayload = {
        env: process.env.NODE_ENV || 'development',
        run_id: params.runId,
        week_start: params.weekStart,
        status: params.status,
        counts: params.counts,
        top_error: params.topError,
        timestamp: new Date().toISOString(),
    };

    return sendAlert(payload);
}

/**
 * Check if alerting should be triggered.
 */
export function shouldAlert(status: string, failedTeams: number): boolean {
    if (status === 'failed') return true;
    if (status === 'partial' && failedTeams > 0) return true;
    return false;
}

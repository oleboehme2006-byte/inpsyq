/**
 * Slack Webhook Client
 * 
 * Sends alerts to Slack with retry, backoff, and timeout.
 * Never logs webhook URL.
 */

export interface SlackBlock {
    type: string;
    text?: { type: string; text: string; emoji?: boolean };
    fields?: Array<{ type: string; text: string }>;
    elements?: Array<{ type: string; text: string }>;
}

export interface SlackPayload {
    text?: string;
    blocks?: SlackBlock[];
    attachments?: Array<{
        color?: string;
        blocks?: SlackBlock[];
    }>;
}

export interface SlackSendOptions {
    timeoutMs?: number;
    maxRetries?: number;
    initialDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<SlackSendOptions> = {
    timeoutMs: 10000,
    maxRetries: 2,
    initialDelayMs: 1000,
};

/**
 * Send a message to Slack webhook with retries.
 */
export async function sendSlackWebhook(
    webhookUrl: string,
    payload: SlackPayload,
    options: SlackSendOptions = {}
): Promise<{ ok: boolean; error?: string }> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return { ok: true };
            }

            const errorText = await response.text().catch(() => 'unknown');

            // Don't retry on 4xx (client errors)
            if (response.status >= 400 && response.status < 500) {
                return { ok: false, error: `Slack returned ${response.status}: ${errorText}` };
            }

            // Retry on 5xx
            if (attempt < opts.maxRetries) {
                const delay = opts.initialDelayMs * Math.pow(2, attempt);
                await sleep(delay);
                continue;
            }

            return { ok: false, error: `Slack returned ${response.status} after ${attempt + 1} attempts` };

        } catch (e: any) {
            if (e.name === 'AbortError') {
                if (attempt < opts.maxRetries) {
                    const delay = opts.initialDelayMs * Math.pow(2, attempt);
                    await sleep(delay);
                    continue;
                }
                return { ok: false, error: 'Request timed out' };
            }

            if (attempt < opts.maxRetries) {
                const delay = opts.initialDelayMs * Math.pow(2, attempt);
                await sleep(delay);
                continue;
            }

            return { ok: false, error: e.message };
        }
    }

    return { ok: false, error: 'Max retries exceeded' };
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Build a professional Slack alert payload.
 */
export function buildSlackAlertPayload(alert: {
    type: string;
    severity: 'critical' | 'warning' | 'info';
    summary: string;
    orgId?: string;
    teamId?: string;
    weekLabel?: string;
    actionHint?: string;
}): SlackPayload {
    const severityEmoji = {
        critical: '🚨',
        warning: '⚠️',
        info: 'ℹ️',
    };

    const severityColor = {
        critical: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
    };

    const fields: Array<{ type: string; text: string }> = [];

    if (alert.orgId) {
        fields.push({ type: 'mrkdwn', text: `*Org:* \`${alert.orgId.slice(0, 8)}...\`` });
    }
    if (alert.teamId) {
        fields.push({ type: 'mrkdwn', text: `*Team:* \`${alert.teamId.slice(0, 8)}...\`` });
    }
    if (alert.weekLabel) {
        fields.push({ type: 'mrkdwn', text: `*Week:* ${alert.weekLabel}` });
    }
    fields.push({ type: 'mrkdwn', text: `*Severity:* ${alert.severity.toUpperCase()}` });

    const blocks: SlackBlock[] = [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `${severityEmoji[alert.severity]} InPsyq Alert: ${alert.type}`,
                emoji: true,
            },
        },
        {
            type: 'section',
            text: { type: 'mrkdwn', text: alert.summary },
        },
    ];

    if (fields.length > 0) {
        blocks.push({
            type: 'section',
            fields,
        });
    }

    if (alert.actionHint) {
        blocks.push({
            type: 'context',
            elements: [{ type: 'mrkdwn', text: `💡 ${alert.actionHint}` }],
        });
    }

    return {
        text: `${severityEmoji[alert.severity]} ${alert.type}: ${alert.summary}`,
        attachments: [{
            color: severityColor[alert.severity],
            blocks,
        }],
    };
}

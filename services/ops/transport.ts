/**
 * Alert Transport Abstraction
 * 
 * Provides pluggable transports for alerts:
 * - SlackTransport: sends to Slack webhook
 * - DisabledTransport: no-ops (for missing URL or disabled mode)
 * - TestTransport: collects messages in memory (for verification)
 */

import { sendSlackWebhook, buildSlackAlertPayload, SlackPayload } from './slack';

export interface AlertMessage {
    type: string;
    severity: 'critical' | 'warning' | 'info';
    summary: string;
    orgId?: string;
    teamId?: string;
    weekLabel?: string;
    actionHint?: string;
    timestamp: string;
}

export interface AlertTransport {
    name: string;
    send(message: AlertMessage): Promise<{ ok: boolean; error?: string }>;
}

/**
 * Slack Transport - sends to ALERT_WEBHOOK_URL
 */
export class SlackTransport implements AlertTransport {
    name = 'slack';
    private webhookUrl: string;

    constructor(webhookUrl: string) {
        this.webhookUrl = webhookUrl;
    }

    async send(message: AlertMessage): Promise<{ ok: boolean; error?: string }> {
        const payload = buildSlackAlertPayload(message);
        return sendSlackWebhook(this.webhookUrl, payload);
    }
}

/**
 * Disabled Transport - no-ops
 */
export class DisabledTransport implements AlertTransport {
    name = 'disabled';

    async send(_message: AlertMessage): Promise<{ ok: boolean; error?: string }> {
        console.log('[AlertTransport] Disabled - alert suppressed');
        return { ok: true };
    }
}

/**
 * Test Transport - collects messages in memory
 */
export class TestTransport implements AlertTransport {
    name = 'test';
    public messages: AlertMessage[] = [];

    async send(message: AlertMessage): Promise<{ ok: boolean; error?: string }> {
        this.messages.push(message);
        return { ok: true };
    }

    clear(): void {
        this.messages = [];
    }

    getCount(): number {
        return this.messages.length;
    }
}

/**
 * Get the appropriate transport based on environment.
 */
export function getAlertTransport(): AlertTransport {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;

    if (!webhookUrl) {
        console.log('[AlertTransport] No ALERT_WEBHOOK_URL configured - using disabled transport');
        return new DisabledTransport();
    }

    return new SlackTransport(webhookUrl);
}

// Global transport instance (can be overridden for testing)
let _transport: AlertTransport | null = null;

export function setAlertTransport(transport: AlertTransport): void {
    _transport = transport;
}

export function getActiveTransport(): AlertTransport {
    if (!_transport) {
        _transport = getAlertTransport();
    }
    return _transport;
}

export function resetTransport(): void {
    _transport = null;
}

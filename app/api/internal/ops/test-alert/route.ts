/**
 * POST /api/internal/ops/test-alert
 * 
 * Sends a test alert to verify Slack integration.
 * Requires INTERNAL_ADMIN_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendAlert, AlertPayload } from '@/services/ops/alerting';

export const dynamic = 'force-dynamic';

interface TestAlertBody {
    severity?: 'critical' | 'warning' | 'info';
    message?: string;
    org_id?: string;
    team_id?: string;
}

export async function POST(req: NextRequest) {
    // Auth check
    const authHeader = req.headers.get('x-internal-admin-secret');
    const secret = process.env.INTERNAL_ADMIN_SECRET;

    if (!secret || authHeader !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    let body: TestAlertBody = {};
    try {
        const text = await req.text();
        if (text) {
            body = JSON.parse(text);
        }
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const severity = body.severity || 'info';
    const message = body.message || 'Test alert from InPsyq ops endpoint';

    const payload: AlertPayload = {
        type: 'TEST_ALERT',
        severity,
        summary: message,
        orgId: body.org_id,
        teamId: body.team_id,
        weekLabel: new Date().toISOString().slice(0, 10),
    };

    try {
        const sent = await sendAlert(payload);
        return NextResponse.json({
            ok: true,
            sent,
            message: sent ? 'Test alert sent' : 'Alert suppressed (dedupe or transport disabled)',
        });
    } catch (e: any) {
        console.error('[test-alert] Failed:', e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}

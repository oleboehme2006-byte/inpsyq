
import './_bootstrap';
import { sendAlert, AlertPayload } from '@/services/ops/alerting';

// Mock Fetch
const originalFetch = global.fetch;
let fetchCalls: any[] = [];

global.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
    // console.log('Mock Fetch:', url);
    fetchCalls.push({ url, body: init?.body ? JSON.parse(init.body as string) : {} });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

async function verifyAlerting() {
    console.log('--- Verifying Alerting (Mocked) ---\n');

    // Set env
    process.env.ALERT_WEBHOOK_URL = 'https://mock.webhook';

    // 1. Send Alert
    const payload: AlertPayload = {
        type: 'WEEKLY_RUN_FAILED',
        severity: 'critical',
        summary: 'Test Alert',
        details: { foo: 'bar' }
    };

    const sent = await sendAlert(payload);
    if (!sent) throw new Error('Alert should be sent');
    if ((fetchCalls.length as number) !== 1) throw new Error('Webhook not called');
    if (fetchCalls[0].body.summary !== 'Test Alert') throw new Error('Payload mismatch');

    console.log('✓ Alert sent successfully');

    // 2. Test Dedupe (Immediate)
    const sent2 = await sendAlert(payload);
    if (sent2) throw new Error('Duplicate alert should be suppressed');
    if ((fetchCalls.length as number) !== 1) throw new Error('Webhook called (should rely on cache)');

    console.log('✓ Deduplication verified');

    // 3. Test New Alert
    const payload2: AlertPayload = { ...payload, summary: 'New Alert' };
    const sent3 = await sendAlert(payload2);
    if (!sent3) throw new Error('New alert should be sent');
    if ((fetchCalls.length as number) !== 2) throw new Error('Webhook not called for new alert');

    console.log('✓ New alert sent');

    // Cleanup
    global.fetch = originalFetch;
}

verifyAlerting().catch(e => {
    console.error(e);
    process.exit(1);
});

/**
 * Verify Phase 16: Alerting
 * 
 * Tests alerting logic using TestTransport (updated for Phase 17 transport refactor).
 */

import './_bootstrap';
import { sendAlert, clearAlertCache, AlertPayload } from '@/services/ops/alerting';
import { TestTransport, setAlertTransport, resetTransport } from '@/services/ops/transport';

async function verifyAlerting() {
    console.log('--- Verifying Alerting (Mocked) ---\n');

    // Use TestTransport instead of mocking fetch
    const testTransport = new TestTransport();
    setAlertTransport(testTransport);
    clearAlertCache();

    // 1. Send Alert
    const payload: AlertPayload = {
        type: 'WEEKLY_RUN_FAILED',
        severity: 'critical',
        summary: 'Test Alert',
    };

    const sent = await sendAlert(payload);
    if (!sent) throw new Error('Alert should be sent');
    if (testTransport.getCount() !== 1) throw new Error('Transport should have 1 message');
    if (testTransport.messages[0].summary !== 'Test Alert') throw new Error('Summary mismatch');

    console.log('✓ Alert sent successfully');

    // 2. Test Dedupe (Immediate)
    const sent2 = await sendAlert(payload);
    if (sent2) throw new Error('Duplicate alert should be suppressed');
    if (testTransport.getCount() !== 1) throw new Error('Transport should still have 1 message');

    console.log('✓ Deduplication verified');

    // 3. Test New Alert
    const payload2: AlertPayload = { ...payload, summary: 'New Alert' };
    const sent3 = await sendAlert(payload2);
    if (!sent3) throw new Error('New alert should be sent');
    if (testTransport.getCount() !== 2) throw new Error('Transport should have 2 messages');

    console.log('✓ New alert sent');

    // Cleanup
    resetTransport();
    clearAlertCache();
}

verifyAlerting().catch(e => {
    console.error(e);
    process.exit(1);
});

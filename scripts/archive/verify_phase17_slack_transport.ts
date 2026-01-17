/**
 * Verify Phase 17: Slack Transport
 * 
 * Tests message shape and transport abstraction without sending to Slack.
 */

import './_bootstrap';
import { TestTransport, setAlertTransport, resetTransport } from '@/services/ops/transport';
import { sendAlert, clearAlertCache } from '@/services/ops/alerting';

async function verifySlackTransport() {
    console.log('--- Verifying Slack Transport ---\n');

    const testTransport = new TestTransport();
    setAlertTransport(testTransport);
    clearAlertCache();

    // 1. Send a critical alert
    const sent1 = await sendAlert({
        type: 'WEEKLY_RUN_FAILED',
        severity: 'critical',
        summary: 'Pipeline failed for org X',
        orgId: 'test-org-123',
        weekLabel: '2024-W01',
    });

    if (!sent1) throw new Error('Alert should be sent');
    if (testTransport.getCount() !== 1) throw new Error('Transport should have 1 message');

    const msg1 = testTransport.messages[0];
    if (msg1.type !== 'WEEKLY_RUN_FAILED') throw new Error('Wrong type');
    if (msg1.severity !== 'critical') throw new Error('Wrong severity');
    if (!msg1.summary.includes('Pipeline failed')) throw new Error('Summary mismatch');
    if (!msg1.actionHint) throw new Error('Action hint missing');
    if (!msg1.timestamp) throw new Error('Timestamp missing');

    console.log('✓ Message shape correct');

    // 2. Send a warning alert
    const sent2 = await sendAlert({
        type: 'LOCK_STUCK',
        severity: 'warning',
        summary: '3 teams have stuck locks',
    });

    if (!sent2) throw new Error('Warning alert should be sent');
    if (testTransport.getCount() !== 2) throw new Error('Transport should have 2 messages');

    const msg2 = testTransport.messages[1];
    if (msg2.severity !== 'warning') throw new Error('Wrong severity for warning');

    console.log('✓ Severity routing correct');

    // 3. Send an info alert
    const sent3 = await sendAlert({
        type: 'TEST_ALERT',
        severity: 'info',
        summary: 'Test info message',
    });

    if (!sent3) throw new Error('Info alert should be sent');
    if (testTransport.getCount() !== 3) throw new Error('Transport should have 3 messages');

    console.log('✓ All severity levels work');

    // Cleanup
    resetTransport();
    console.log('\n✅ Slack Transport Verified');
}

verifySlackTransport().catch(e => {
    console.error(e);
    process.exit(1);
});

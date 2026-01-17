/**
 * Verify Phase 17: Dedupe
 * 
 * Tests that duplicate alerts are suppressed within the dedupe window.
 */

import './_bootstrap';
import { TestTransport, setAlertTransport, resetTransport } from '@/services/ops/transport';
import { sendAlert, clearAlertCache } from '@/services/ops/alerting';

async function verifyDedupe() {
    console.log('--- Verifying Alert Dedupe ---\n');

    const testTransport = new TestTransport();
    setAlertTransport(testTransport);
    clearAlertCache();

    const payload = {
        type: 'LOCK_STUCK' as const,
        severity: 'warning' as const,
        summary: 'Test duplicate alert',
        orgId: 'org-123',
    };

    // 1. First send should succeed
    const sent1 = await sendAlert(payload);
    if (!sent1) throw new Error('First alert should be sent');
    if (testTransport.getCount() !== 1) throw new Error('Transport should have 1 message');

    console.log('✓ First alert sent');

    // 2. Immediate duplicate should be suppressed
    const sent2 = await sendAlert(payload);
    if (sent2) throw new Error('Duplicate alert should be suppressed');
    if (testTransport.getCount() !== 1) throw new Error('Transport should still have 1 message');

    console.log('✓ Duplicate suppressed');

    // 3. Different alert should succeed
    const differentPayload = {
        type: 'COVERAGE_GAP' as const,
        severity: 'critical' as const,
        summary: 'Different alert type',
    };

    const sent3 = await sendAlert(differentPayload);
    if (!sent3) throw new Error('Different alert should be sent');
    if (testTransport.getCount() !== 2) throw new Error('Transport should have 2 messages');

    console.log('✓ Different alert sent');

    // 4. Same type but different summary should succeed
    const differentSummary = {
        ...payload,
        summary: 'Different summary text',
    };

    const sent4 = await sendAlert(differentSummary);
    if (!sent4) throw new Error('Alert with different summary should be sent');
    if (testTransport.getCount() !== 3) throw new Error('Transport should have 3 messages');

    console.log('✓ Different summary sent');

    // Cleanup
    resetTransport();
    clearAlertCache();
    console.log('\n✅ Dedupe Verified');
}

verifyDedupe().catch(e => {
    console.error(e);
    process.exit(1);
});

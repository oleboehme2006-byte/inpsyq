#!/usr/bin/env npx tsx
/**
 * VERIFY PHASE 14: INTEGRITY AUDIT
 * 
 * Tests that audit logs are written for critical events.
 */

import './_bootstrap';
import { query } from '../db/client';
import { logAuditEvent } from '@/services/audit/events';
import { logIntegrityViolation } from '@/services/audit/integrity';
import { DEV_ORG_ID } from '../lib/dev/fixtures';

async function main() {
    console.log('--- VERIFY: INTEGRITY AUDIT ---');

    const TEST_CONTEXT = 'verify-script-' + Date.now();

    // 1. Log a standard audit event
    console.log('1. Logging standard audit event...');
    await logAuditEvent(DEV_ORG_ID, null, 'RUN_START', { testId: TEST_CONTEXT });

    // 2. Log an integrity violation
    console.log('2. Logging integrity violation...');
    await logIntegrityViolation(DEV_ORG_ID, 'VerifyScript', { testId: TEST_CONTEXT, violation: 'simulated' });

    // 3. Verify logs exist
    console.log('3. Verifying logs in DB...');
    const res = await query(`
        SELECT event_type, metadata 
        FROM audit_events 
        WHERE metadata->>'testId' = $1 OR metadata->'details'->>'testId' = $1
    `, [TEST_CONTEXT]);

    if (res.rows.length !== 2) {
        console.error(`FAILED: Expected 2 log entries, found ${res.rows.length}`);
        process.exit(1);
    }

    const types = res.rows.map(r => r.event_type).sort();
    if (types[0] !== 'INTEGRITY_VIOLATION' || types[1] !== 'RUN_START') {
        console.error('FAILED: Log types mismatch:', types);
        process.exit(1);
    }

    console.log('SUCCESS: Audit logs verified.');
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});

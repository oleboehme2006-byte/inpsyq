/**
 * Test Organization Verification Script
 * 
 * Tests test organization state invariants:
 * - orgId = 99999999-9999-4999-8999-999999999999
 * - managedTeamCount = 3
 * - managedEmployeeCount = 15
 * - weekCount >= 6
 * - interpretationCount > 0
 * 
 * Run: BASE_URL=<url> INTERNAL_ADMIN_SECRET=<secret> npx tsx scripts/verification/test-org.verify.ts
 */

import './../_bootstrap';
import { strict as assert } from 'node:assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const TEST_ORG_ID = '99999999-9999-4999-8999-999999999999';

async function verify() {
    console.log('Test Organization Verification');
    console.log(`Target: ${BASE_URL}\n`);

    if (!ADMIN_SECRET) {
        console.error('❌ INTERNAL_ADMIN_SECRET required');
        process.exit(1);
    }

    // Fetch status
    console.log('1. Fetching test org status');
    const res = await fetch(`${BASE_URL}/api/internal/admin/test-org/status`, {
        headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` },
    });

    if (!res.ok) {
        console.error(`❌ Status request failed: ${res.status}`);
        process.exit(1);
    }

    const body = await res.json();
    if (!body.ok || !body.data) {
        console.error('❌ Invalid response:', body);
        process.exit(1);
    }

    const status = body.data;
    console.log('   ✅ Status fetched\n');

    // Verify invariants
    console.log('2. Verifying invariants');

    // Org exists
    assert.ok(status.exists, 'Org should exist');
    console.log('   ✅ Org exists');

    // Correct org ID
    assert.equal(status.orgId, TEST_ORG_ID, 'Should be dedicated test org ID');
    console.log(`   ✅ orgId = ${TEST_ORG_ID}`);

    // Team count
    assert.equal(status.managedTeamCount, 3, 'Should have 3 managed teams');
    console.log('   ✅ managedTeamCount = 3');

    // Employee count
    assert.equal(status.managedEmployeeCount, 15, 'Should have 15 managed employees');
    console.log('   ✅ managedEmployeeCount = 15');

    // Week count
    assert.ok(status.weekCount >= 6, `Should have >= 6 weeks (got ${status.weekCount})`);
    console.log(`   ✅ weekCount = ${status.weekCount}`);

    // Interpretation count
    assert.ok(status.interpretationCount > 0, 'Should have interpretations');
    console.log(`   ✅ interpretationCount = ${status.interpretationCount}\n`);

    console.log('All test org invariants verified ✅');
}

verify().catch(e => {
    console.error('Verification failed:', e);
    process.exit(1);
});

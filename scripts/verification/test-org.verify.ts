#!/usr/bin/env npx tsx
/**
 * Test Organization Verification
 * 
 * Validates test organization structure and seeding:
 * - TEST_ORG_ID is correct
 * - 3 canonical teams exist
 * - 15 synthetic employees exist
 * - Seeded data is present
 * 
 * Run:
 *   npx tsx scripts/verification/test-org.verify.ts
 * 
 * Production Run:
 *   BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=xxx npx tsx scripts/verification/test-org.verify.ts
 */

import { strict as assert } from 'node:assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const TEST_ORG_ID = '99999999-9999-4999-8999-999999999999';

async function main() {
    console.log('Test Organization Verification\n');
    console.log(`Target: ${BASE_URL}`);
    console.log(`Expected TEST_ORG_ID: ${TEST_ORG_ID}\n`);

    if (!ADMIN_SECRET) {
        console.error('❌ INTERNAL_ADMIN_SECRET required');
        process.exit(1);
    }

    // Test 1: Status Endpoint
    console.log('Test 1: Fetch test org status');
    const statusRes = await fetch(`${BASE_URL}/api/internal/admin/test-org/status`, {
        headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` },
    });

    if (!statusRes.ok) {
        console.error('  ❌ Status endpoint failed:', statusRes.status);
        process.exit(1);
    }

    const statusBody = await statusRes.json();
    assert.ok(statusBody.ok, 'Response should have ok: true');
    const status = statusBody.data;
    console.log('  ✅ Status endpoint returned');

    // Test 2: Org exists
    console.log('Test 2: Org exists with correct ID');
    assert.ok(status.exists, 'Org should exist');
    assert.equal(status.orgId, TEST_ORG_ID, 'Org ID should be TEST_ORG_ID');
    assert.ok(status.isCanonicalId, 'Should be canonical ID');
    console.log('  ✅ Passed');

    // Test 3: Teams
    console.log('Test 3: 3 managed teams');
    assert.equal(status.managedTeamCount, 3, 'Should have 3 managed teams');
    console.log('  ✅ Passed');

    // Test 4: Employees
    console.log('Test 4: 15 managed employees');
    assert.equal(status.managedEmployeeCount, 15, 'Should have 15 managed employees');
    console.log('  ✅ Passed');

    // Test 5: Seeded weeks
    console.log('Test 5: Seeded weeks');
    assert.ok(status.weekCount >= 1, `Should have at least 1 week of data (got ${status.weekCount})`);
    console.log(`  ✅ Passed (${status.weekCount} weeks)`);

    // Test 6: Sessions
    console.log('Test 6: Sessions exist');
    assert.ok(status.sessionCount > 0, 'Should have sessions');
    console.log(`  ✅ Passed (${status.sessionCount} sessions)`);

    // Test 7: Interpretations
    console.log('Test 7: Interpretations exist');
    assert.ok(status.interpretationCount > 0, 'Should have interpretations');
    console.log(`  ✅ Passed (${status.interpretationCount} interpretations)`);

    console.log('\n✅ All test org checks passed');
}

main().catch(e => {
    console.error('❌ Failed:', e.message);
    process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * Production Organization List Verification
 * 
 * Verifies that:
 * 1. User can mint a login link (admin role)
 * 2. User can authenticate via magic link (consume)
 * 3. /api/org/list returns valid list of organizations even without selected org context
 * 4. Response structure matches contract: { ok: true, data: { orgs: [...] } }
 * 
 * Requires: BASE_URL, INTERNAL_ADMIN_SECRET
 */

import { strict as assert } from 'node:assert';


const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const TEST_ORG_ID = '99999999-9999-4999-8999-999999999999';

if (!ADMIN_SECRET) {
    console.error('❌ INTERNAL_ADMIN_SECRET required');
    process.exit(1);
}

async function main() {
    console.log('Production Org List Verification\n');
    console.log(`Target: ${BASE_URL}`);

    // 1. Mint Login Link
    console.log('1. Minting login link...');
    const mintRes = await fetch(`${BASE_URL}/api/internal/admin/mint-login-link`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ADMIN_SECRET}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: 'oleboehme2006@gmail.com' })
    });

    if (!mintRes.ok) throw new Error(`Mint failed: ${mintRes.status}`);
    const mintBody = await mintRes.json() as any;
    const loginUrl = mintBody.data?.url;
    assert.ok(loginUrl, 'Should return login URL');
    console.log('   ✅ Minted');

    // 2. Consume Token (Get Session)
    console.log('2. Consuming token to get session...');
    const consumeRes = await fetch(loginUrl, { redirect: 'manual' });
    const cookies = consumeRes.headers.get('set-cookie');
    assert.ok(cookies, 'Should receive cookies');
    assert.ok(cookies.includes('inpsyq_session'), 'Should have session cookie');
    console.log('   ✅ Session created');

    // 3. Call Org List (API Contract Check)
    console.log('3. Fetching /api/org/list...');
    const listRes = await fetch(`${BASE_URL}/api/org/list`, {
        headers: {
            'Cookie': cookies
        }
    });

    if (!listRes.ok) {
        throw new Error(`/api/org/list failed with status ${listRes.status}`);
    }

    const listBody = await listRes.json() as any;

    // Assert contract
    assert.equal(listBody.ok, true, 'Response ok should be true');
    assert.ok(listBody.data, 'Should have data object');
    assert.ok(Array.isArray(listBody.data.orgs), 'Should have data.orgs array');

    const orgs = listBody.data.orgs;
    console.log(`   ✅ Received ${orgs.length} organizations`);

    if (orgs.length === 0) {
        throw new Error('Org list is empty but user should have memberships');
    }

    // Assert Test Org presence
    const testOrg = orgs.find((o: any) => o.orgId === TEST_ORG_ID);
    assert.ok(testOrg, `Should find Test Org ${TEST_ORG_ID}`);
    assert.equal(testOrg.role, 'ADMIN', 'Should be ADMIN in Test Org');

    console.log('   ✅ Test Org found and verified');
    console.log('\n✅ All Org List checks passed');
}

main().catch(e => {
    console.error('❌ Failed:', e.message);
    process.exit(1);
});

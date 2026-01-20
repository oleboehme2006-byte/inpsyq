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
import { writeFileSync, mkdirSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const TEST_ORG_ID = '99999999-9999-4999-8999-999999999999';
const ARTIFACTS_DIR = 'artifacts/verification_suite';

if (!ADMIN_SECRET) {
    console.error('❌ INTERNAL_ADMIN_SECRET required');
    process.exit(1);
}

/**
 * Parse Set-Cookie header(s) into Cookie header format.
 * Handles both single string and array of cookies.
 */
function parseSetCookieToCookie(setCookieHeader: string | null): string {
    if (!setCookieHeader) return '';

    // Set-Cookie can be comma-separated for multiple cookies or separate headers
    // Each cookie is in format: name=value; Path=...; HttpOnly; etc.
    // We only need name=value pairs
    const cookies: string[] = [];

    // Split by comma but be careful of expires dates which contain commas
    // Simple approach: split by ', ' followed by a cookie name pattern
    const parts = setCookieHeader.split(/,\s*(?=[a-zA-Z_][a-zA-Z0-9_]*=)/);

    for (const part of parts) {
        // Extract just the name=value before any semicolon
        const match = part.match(/^([^=]+=[^;]+)/);
        if (match) {
            cookies.push(match[1].trim());
        }
    }

    return cookies.join('; ');
}

async function main() {
    console.log('Production Org List Verification\n');
    console.log(`Target: ${BASE_URL}`);

    mkdirSync(ARTIFACTS_DIR, { recursive: true });
    const artifact: Record<string, any> = { timestamp: new Date().toISOString(), target: BASE_URL };

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

    if (!mintRes.ok) {
        const errBody = await mintRes.text();
        throw new Error(`Mint failed: ${mintRes.status} - ${errBody}`);
    }
    const mintBody = await mintRes.json() as any;
    const loginUrl = mintBody.data?.url;
    assert.ok(loginUrl, 'Should return login URL');
    console.log('   ✅ Minted');
    artifact.mintStatus = 'OK';

    // 2. Consume Token (Get Session)
    console.log('2. Consuming token to get session...');
    const consumeRes = await fetch(loginUrl, { redirect: 'manual' });
    const rawSetCookie = consumeRes.headers.get('set-cookie');

    if (!rawSetCookie) {
        throw new Error('No Set-Cookie header received from /auth/consume');
    }

    // Parse Set-Cookie to Cookie format
    const cookieHeader = parseSetCookieToCookie(rawSetCookie);
    assert.ok(cookieHeader.includes('inpsyq_session'), 'Should have session cookie');
    console.log('   ✅ Session created');
    artifact.sessionStatus = 'OK';
    artifact.cookiesParsed = cookieHeader.replace(/=[^;]+/g, '=***'); // Mask values

    // 3. Call Org List (API Contract Check)
    console.log('3. Fetching /api/org/list...');
    const listRes = await fetch(`${BASE_URL}/api/org/list`, {
        headers: {
            'Cookie': cookieHeader
        }
    });

    if (!listRes.ok) {
        const errBody = await listRes.text();
        throw new Error(`/api/org/list failed with status ${listRes.status}: ${errBody}`);
    }

    const listBody = await listRes.json() as any;

    // Assert contract
    assert.equal(listBody.ok, true, 'Response ok should be true');
    assert.ok(listBody.data, 'Should have data object');
    assert.ok(Array.isArray(listBody.data.orgs), 'Should have data.orgs array');

    const orgs = listBody.data.orgs;
    console.log(`   ✅ Received ${orgs.length} organizations`);
    artifact.orgCount = orgs.length;

    if (orgs.length === 0) {
        artifact.status = 'FAIL';
        artifact.error = 'Org list is empty but user should have memberships';
        writeFileSync(`${ARTIFACTS_DIR}/prod_orglist.json`, JSON.stringify(artifact, null, 2));
        throw new Error('Org list is empty but user should have memberships');
    }

    // Assert Test Org presence
    const testOrg = orgs.find((o: any) => o.orgId === TEST_ORG_ID);
    assert.ok(testOrg, `Should find Test Org ${TEST_ORG_ID}`);
    assert.equal(testOrg.role, 'ADMIN', 'Should be ADMIN in Test Org');

    console.log('   ✅ Test Org found and verified');
    artifact.testOrgFound = true;
    artifact.testOrgRole = testOrg.role;
    artifact.status = 'PASS';

    // Write artifact
    writeFileSync(`${ARTIFACTS_DIR}/prod_orglist.json`, JSON.stringify(artifact, null, 2));
    console.log('\n✅ All Org List checks passed');
}

main().catch(e => {
    console.error('❌ Failed:', e.message);
    process.exit(1);
});

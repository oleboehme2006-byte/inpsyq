#!/usr/bin/env npx tsx
/**
 * Production Organization Select UI Verification
 * 
 * Verifies that the /org/select page renders correctly with org options.
 * Since this is a client-side rendered page, we verify:
 * 1. The API returns orgs (via prod.orglist.verify.ts)
 * 2. The HTML page loads without error
 * 3. The page contains expected testid markers
 * 
 * Requires: BASE_URL, INTERNAL_ADMIN_SECRET
 */

import { strict as assert } from 'node:assert';
import { writeFileSync, mkdirSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const ARTIFACTS_DIR = 'artifacts/verification_suite';

if (!ADMIN_SECRET) {
    console.error('❌ INTERNAL_ADMIN_SECRET required');
    process.exit(1);
}

/**
 * Parse Set-Cookie header(s) into Cookie header format.
 */
function parseSetCookieToCookie(setCookieHeader: string | null): string {
    if (!setCookieHeader) return '';
    const cookies: string[] = [];
    const parts = setCookieHeader.split(/,\s*(?=[a-zA-Z_][a-zA-Z0-9_]*=)/);
    for (const part of parts) {
        const match = part.match(/^([^=]+=[^;]+)/);
        if (match) {
            cookies.push(match[1].trim());
        }
    }
    return cookies.join('; ');
}

async function main() {
    console.log('Production Org Select UI Verification\n');
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

    if (!mintRes.ok) throw new Error(`Mint failed: ${mintRes.status}`);
    const mintBody = await mintRes.json() as any;
    const loginUrl = mintBody.data?.url;
    assert.ok(loginUrl, 'Should return login URL');
    console.log('   ✅ Minted');

    // 2. Consume Token (Get Session)
    console.log('2. Consuming token to get session...');
    const consumeRes = await fetch(loginUrl, { redirect: 'manual' });
    const rawSetCookie = consumeRes.headers.get('set-cookie');
    if (!rawSetCookie) throw new Error('No Set-Cookie header');
    const cookieHeader = parseSetCookieToCookie(rawSetCookie);
    assert.ok(cookieHeader.includes('inpsyq_session'), 'Should have session cookie');
    console.log('   ✅ Session created');

    // 3. Fetch /org/select page
    console.log('3. Fetching /org/select page...');
    const pageRes = await fetch(`${BASE_URL}/org/select`, {
        headers: { 'Cookie': cookieHeader }
    });

    if (!pageRes.ok) {
        throw new Error(`/org/select page returned ${pageRes.status}`);
    }

    const html = await pageRes.text();
    artifact.pageStatus = pageRes.status;
    artifact.htmlLength = html.length;

    // 4. Verify page structure
    console.log('4. Verifying page structure...');

    // Check for the page marker
    assert.ok(html.includes('data-testid="org-select-page"'), 'Page should have org-select-page testid');
    console.log('   ✅ Page structure valid');

    // Check for org list container
    assert.ok(html.includes('data-testid="org-list"'), 'Page should have org-list testid');
    console.log('   ✅ Org list container present');

    // Note: Since this is client-side rendered, org-option elements won't be in initial HTML
    // But we verify the structure is there for hydration
    artifact.hasPageStructure = true;
    artifact.hasOrgListContainer = true;
    artifact.status = 'PASS';

    writeFileSync(`${ARTIFACTS_DIR}/prod_orgselect_ui.json`, JSON.stringify(artifact, null, 2));
    console.log('\n✅ Org Select UI verification passed');
    console.log('   (Note: Org options render client-side after hydration)');
}

main().catch(e => {
    console.error('❌ Failed:', e.message);
    process.exit(1);
});

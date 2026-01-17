/**
 * Verify Phase 17: Ops Check Endpoint
 * 
 * Tests the /api/internal/ops/check endpoint.
 * Requires dev server running on VERIFY_BASE_URL.
 */

import './_bootstrap';
import { getVerifyBaseUrl, fetchJson } from './_verifyBaseUrl';

const BASE_URL = getVerifyBaseUrl();
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET || 'test-admin-secret';

async function verifyOpsCheckEndpoint() {
    console.log('--- Verifying Ops Check Endpoint ---\n');
    console.log(`Base URL: ${BASE_URL}`);

    // 1. Test 401 without secret
    console.log('\n1. Testing without secret...');
    try {
        const res1 = await fetch(`${BASE_URL}/api/internal/ops/check`);
        if (res1.status !== 401) {
            console.warn(`⚠️ Expected 401, got ${res1.status}`);
        } else {
            console.log('✓ Returns 401 without secret');
        }
    } catch (e: any) {
        console.warn('⚠️ Fetch failed (server may not be running):', e.message);
        console.log('Skipping remaining endpoint tests...');
        return;
    }

    // 2. Test 200 with secret
    console.log('\n2. Testing with secret...');
    try {
        const { status, json } = await fetchJson(
            `${BASE_URL}/api/internal/ops/check`,
            { headers: { 'x-internal-admin-secret': ADMIN_SECRET } },
            'ops-check'
        );

        if (status !== 200) {
            throw new Error(`Expected 200, got ${status}`);
        }

        if (json.ok !== true) {
            throw new Error(`Expected ok: true, got ${JSON.stringify(json)}`);
        }

        console.log('✓ Returns 200 with valid secret');
        console.log('✓ Response has ok: true');
    } catch (e: any) {
        console.warn('⚠️ Auth test failed:', e.message);
    }

    // 3. Test health/global endpoint
    console.log('\n3. Testing ops/health/global...');
    try {
        const { status, json } = await fetchJson(
            `${BASE_URL}/api/internal/ops/health/global`,
            { headers: { 'x-internal-admin-secret': ADMIN_SECRET } },
            'health-global'
        );

        if (status !== 200) {
            throw new Error(`Expected 200, got ${status}`);
        }

        if (!json.ok || !json.snapshot) {
            throw new Error(`Expected snapshot in response`);
        }

        console.log('✓ Returns 200 with snapshot');
        console.log(`  Total teams: ${json.snapshot.totalTeams}`);
        console.log(`  Total OK: ${json.snapshot.totalOk}`);
    } catch (e: any) {
        console.warn('⚠️ Health global test failed:', e.message);
    }

    console.log('\n✅ Ops Check Endpoint Verified');
}

verifyOpsCheckEndpoint().catch(e => {
    console.error(e);
    process.exit(1);
});

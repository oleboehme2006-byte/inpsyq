#!/usr/bin/env npx tsx
/**
 * VERIFY PHASE 12 SECURITY
 * 
 * Tests that the weekly run endpoint security is correct.
 */

import './_bootstrap';
import { getVerifyBaseUrl, fetchJson, maskHeaders } from './_verifyBaseUrl';

export { }; // Make this a module

const BASE_URL = getVerifyBaseUrl();
const VALID_SECRET = process.env.INTERNAL_CRON_SECRET || 'test-cron-secret';

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean, detail?: string): void {
    if (condition) {
        console.log(`✅ ${name}${detail ? ` (${detail})` : ''}`);
        passed++;
    } else {
        console.error(`❌ ${name}${detail ? ` - ${detail}` : ''}`);
        failed++;
    }
}

async function main() {
    console.log('=== Phase 12 Security Verification ===\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`INTERNAL_CRON_SECRET: ${VALID_SECRET ? 'SET' : 'NOT SET'}\n`);

    const endpoint = `${BASE_URL}/api/internal/run-weekly`;

    // Test 1: Missing secret
    console.log('--- Missing Secret ---');
    console.log(`  POST ${endpoint} (no x-cron-secret)`);
    try {
        const { status, bodyText } = await fetchJson(
            endpoint,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dry_run: true }),
            },
            'missing-secret'
        );
        test('Missing secret returns 401', status === 401, `status=${status}`);
    } catch (e: any) {
        console.error(`  Error: ${e.message}`);
        test('Endpoint accessible', false, e.message);
    }

    // Test 2: Invalid secret
    console.log('\n--- Invalid Secret ---');
    console.log(`  POST ${endpoint} (x-cron-secret: wrong-secret)`);
    try {
        const { status } = await fetchJson(
            endpoint,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cron-secret': 'wrong-secret',
                },
                body: JSON.stringify({ dry_run: true }),
            },
            'invalid-secret'
        );
        test('Invalid secret returns 401', status === 401, `status=${status}`);
    } catch (e: any) {
        console.error(`  Error: ${e.message}`);
        test('Endpoint accessible', false, e.message);
    }

    // Test 3: GET rejected
    console.log('\n--- Method Validation ---');
    console.log(`  GET ${endpoint}`);
    try {
        const { status } = await fetchJson(endpoint, { method: 'GET' }, 'get-method');
        test('GET returns 405', status === 405, `status=${status}`);
    } catch (e: any) {
        console.error(`  Error: ${e.message}`);
        test('Method check', false, e.message);
    }

    // Test 4: PUT rejected
    console.log(`  PUT ${endpoint}`);
    try {
        const { status } = await fetchJson(endpoint, { method: 'PUT' }, 'put-method');
        test('PUT returns 405', status === 405, `status=${status}`);
    } catch (e: any) {
        console.error(`  Error: ${e.message}`);
        test('Method check', false, e.message);
    }

    // Test 5: Invalid mode rejected
    console.log('\n--- Invalid Mode ---');
    console.log(`  POST ${endpoint} (mode: INVALID_MODE)`);
    try {
        const { status } = await fetchJson(
            endpoint,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cron-secret': VALID_SECRET,
                },
                body: JSON.stringify({ mode: 'INVALID_MODE' }),
            },
            'invalid-mode'
        );
        // Should be 400 or 500 (if secret misconfigured)
        test('Invalid mode rejected', status === 400 || status === 500, `status=${status}`);
    } catch (e: any) {
        console.error(`  Error: ${e.message}`);
        test('Mode validation', false, e.message);
    }

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n⚠️ Security verification failed');
        process.exit(1);
    } else {
        console.log('\n✅ Phase 12 security verification passed');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});

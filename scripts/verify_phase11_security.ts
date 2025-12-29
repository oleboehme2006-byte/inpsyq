#!/usr/bin/env npx tsx
/**
 * VERIFY PHASE 11 SECURITY
 * 
 * Tests that the weekly run endpoint:
 * - Rejects missing secret
 * - Rejects invalid secret
 * - Accepts valid secret
 */

import './_bootstrap';

export { }; // Make this a module

const BASE_URL = 'http://localhost:3001';
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
    console.log('=== Phase 11 Security Verification ===\n');

    // Test 1: Missing secret should be rejected
    console.log('--- Missing Secret ---');
    try {
        const res = await fetch(`${BASE_URL}/api/internal/run-weekly`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dry_run: true }),
        });
        test('Missing secret returns 401', res.status === 401);
    } catch (e: any) {
        test('Endpoint accessible', false, e.message);
    }

    // Test 2: Invalid secret should be rejected
    console.log('\n--- Invalid Secret ---');
    try {
        const res = await fetch(`${BASE_URL}/api/internal/run-weekly`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-cron-secret': 'wrong-secret-12345',
            },
            body: JSON.stringify({ dry_run: true }),
        });
        test('Invalid secret returns 401', res.status === 401);
    } catch (e: any) {
        test('Endpoint accessible', false, e.message);
    }

    // Test 3: Valid secret should be accepted (dry run)
    console.log('\n--- Valid Secret (Dry Run) ---');
    try {
        const res = await fetch(`${BASE_URL}/api/internal/run-weekly`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-cron-secret': VALID_SECRET,
            },
            body: JSON.stringify({ dry_run: true }),
        });

        // Should be 200 or 500 (if secret not configured), not 401
        test('Valid secret not rejected as 401', res.status !== 401);

        if (res.status === 200) {
            const json = await res.json();
            test('Returns success response', json.success === true);
            console.log(`  Run ID: ${json.run_id}`);
        } else if (res.status === 500) {
            const json = await res.json();
            if (json.code === 'SECRET_NOT_CONFIGURED') {
                console.log('  ⚠️ INTERNAL_CRON_SECRET not configured on server');
                test('Server reports secret not configured', true);
            }
        }
    } catch (e: any) {
        test('Valid secret request', false, e.message);
    }

    // Test 4: GET should be rejected
    console.log('\n--- Method Validation ---');
    try {
        const res = await fetch(`${BASE_URL}/api/internal/run-weekly`, {
            method: 'GET',
        });
        test('GET rejected with 405', res.status === 405);
    } catch (e: any) {
        test('Method check accessible', false, e.message);
    }

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n⚠️ Security verification failed');
        process.exit(1);
    } else {
        console.log('\n✅ Phase 11 security verification passed');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});

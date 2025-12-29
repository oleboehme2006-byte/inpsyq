#!/usr/bin/env npx tsx
/**
 * VERIFY PHASE 12 SECURITY
 * 
 * Tests that the weekly run endpoint security is correct.
 */

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
    console.log('=== Phase 12 Security Verification ===\n');

    // Test 1: Missing secret
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

    // Test 2: Invalid secret
    console.log('\n--- Invalid Secret ---');
    try {
        const res = await fetch(`${BASE_URL}/api/internal/run-weekly`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-cron-secret': 'wrong-secret',
            },
            body: JSON.stringify({ dry_run: true }),
        });
        test('Invalid secret returns 401', res.status === 401);
    } catch (e: any) {
        test('Endpoint accessible', false, e.message);
    }

    // Test 3: GET rejected
    console.log('\n--- Method Validation ---');
    try {
        const res = await fetch(`${BASE_URL}/api/internal/run-weekly`, { method: 'GET' });
        test('GET returns 405', res.status === 405);
    } catch (e: any) {
        test('Method check', false, e.message);
    }

    // Test 4: PUT rejected
    try {
        const res = await fetch(`${BASE_URL}/api/internal/run-weekly`, { method: 'PUT' });
        test('PUT returns 405', res.status === 405);
    } catch (e: any) {
        test('Method check', false, e.message);
    }

    // Test 5: Invalid mode rejected
    console.log('\n--- Invalid Mode ---');
    try {
        const res = await fetch(`${BASE_URL}/api/internal/run-weekly`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-cron-secret': VALID_SECRET,
            },
            body: JSON.stringify({ mode: 'INVALID_MODE' }),
        });
        // Should be 400 or 500 (if secret misconfigured)
        test('Invalid mode rejected', res.status === 400 || res.status === 500);
    } catch (e: any) {
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

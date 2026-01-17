#!/usr/bin/env npx tsx
/**
 * Production Smoke Verification
 *
 * Quick health checks for production:
 * - Public pages reachable
 * - Health endpoint responds
 * - No critical errors
 *
 * When to run:
 * - After production deployment
 * - As part of monitoring
 *
 * Required environment:
 * - BASE_URL: Target environment URL
 * - INTERNAL_ADMIN_SECRET: Admin authentication
 *
 * Expected output: All endpoints respond correctly.
 */

import '../_bootstrap';

const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;

interface TestResult {
    name: string;
    passed: boolean;
    details?: any;
    error?: string;
}

async function main() {
    console.log('═'.repeat(60));
    console.log('  Production Smoke Verification');
    console.log('═'.repeat(60));
    console.log(`  Target: ${BASE_URL}`);
    console.log('═'.repeat(60) + '\n');

    const results: TestResult[] = [];

    // Test 1: Landing page
    console.log('Test 1: Landing page...');
    try {
        const res = await fetch(BASE_URL);
        if (res.ok) {
            results.push({ name: 'Landing page', passed: true });
            console.log(`  ✅ Status: ${res.status}`);
        } else {
            results.push({ name: 'Landing page', passed: false, error: `Status ${res.status}` });
            console.log(`  ❌ Status: ${res.status}`);
        }
    } catch (e: any) {
        results.push({ name: 'Landing page', passed: false, error: e.message });
        console.log(`  ❌ ${e.message}`);
    }

    // Test 2: Login page
    console.log('Test 2: Login page...');
    try {
        const res = await fetch(`${BASE_URL}/login`);
        if (res.ok) {
            results.push({ name: 'Login page', passed: true });
            console.log(`  ✅ Status: ${res.status}`);
        } else {
            results.push({ name: 'Login page', passed: false, error: `Status ${res.status}` });
            console.log(`  ❌ Status: ${res.status}`);
        }
    } catch (e: any) {
        results.push({ name: 'Login page', passed: false, error: e.message });
        console.log(`  ❌ ${e.message}`);
    }

    // Test 3: Demo page
    console.log('Test 3: Demo page...');
    try {
        const res = await fetch(`${BASE_URL}/demo`);
        if (res.ok) {
            results.push({ name: 'Demo page', passed: true });
            console.log(`  ✅ Status: ${res.status}`);
        } else {
            results.push({ name: 'Demo page', passed: false, error: `Status ${res.status}` });
            console.log(`  ❌ Status: ${res.status}`);
        }
    } catch (e: any) {
        results.push({ name: 'Demo page', passed: false, error: e.message });
        console.log(`  ❌ ${e.message}`);
    }

    // Test 4: Health endpoint (if secret provided)
    if (ADMIN_SECRET) {
        console.log('Test 4: Health endpoint...');
        try {
            const res = await fetch(`${BASE_URL}/api/internal/health/system`, {
                headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` },
            });
            const body = await res.json();
            if (res.ok && body.status === 'healthy') {
                results.push({ name: 'Health endpoint', passed: true });
                console.log(`  ✅ Status: healthy`);
            } else {
                results.push({ name: 'Health endpoint', passed: false, error: body.status || 'unknown' });
                console.log(`  ❌ Status: ${body.status}`);
            }
        } catch (e: any) {
            results.push({ name: 'Health endpoint', passed: false, error: e.message });
            console.log(`  ❌ ${e.message}`);
        }
    } else {
        console.log('Test 4: Health endpoint... (skipped, no INTERNAL_ADMIN_SECRET)');
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('SUMMARY');
    console.log('═'.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    for (const r of results) {
        console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
    }

    console.log(`\nTotal: ${passed}/${results.length} passed`);

    if (failed > 0) {
        console.log('\n❌ SMOKE TEST FAILED');
        process.exit(1);
    } else {
        console.log('\n✅ SMOKE TEST PASSED');
    }
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});

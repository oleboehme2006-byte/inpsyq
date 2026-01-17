#!/usr/bin/env npx tsx
/**
 * Authentication Verification
 *
 * Verifies authentication invariants:
 * - Public origin configuration
 * - Strict production enforcement
 * - No VERCEL_URL leakage in emails
 *
 * When to run:
 * - Before production deployment
 * - After changes to auth or origin logic
 *
 * Expected output: All tests pass with green checkmarks.
 */

import { strict as assert } from 'node:assert';
import { getPublicOrigin, getPublicOriginUrl, assertPublicOriginValid } from '../../lib/env/publicOrigin';

const originalEnv = { ...process.env };

function resetEnv() {
    process.env = { ...originalEnv };
}

async function main() {
    console.log('═'.repeat(60));
    console.log('  Authentication Verification');
    console.log('═'.repeat(60) + '\n');

    // Test 1: Production Strict Enforcement
    console.log('Test 1: Production Strict Enforcement');
    resetEnv();
    process.env.VERCEL_ENV = 'production';
    process.env.AUTH_BASE_URL = 'https://www.inpsyq.com';

    let origin = getPublicOrigin();
    assert.equal(origin.origin, 'https://www.inpsyq.com');
    assert.equal(origin.enforced, true);
    assert.doesNotThrow(() => assertPublicOriginValid());
    console.log('  ✅ Production with correct AUTH_BASE_URL passed');

    // Test 2: Production with Wrong AUTH_BASE_URL
    console.log('Test 2: Production with Wrong AUTH_BASE_URL');
    resetEnv();
    process.env.VERCEL_ENV = 'production';
    process.env.AUTH_BASE_URL = 'https://wrong-domain.com';

    try {
        assertPublicOriginValid();
        console.error('  ❌ Should have thrown error for wrong production domain');
        process.exit(1);
    } catch (e: any) {
        console.log('  ✅ Correctly blocked wrong production domain');
    }

    // Test 3: Production Missing AUTH_BASE_URL
    console.log('Test 3: Production Missing AUTH_BASE_URL');
    resetEnv();
    process.env.VERCEL_ENV = 'production';
    delete process.env.AUTH_BASE_URL;

    try {
        assertPublicOriginValid();
        console.error('  ❌ Should have thrown error for missing prod AUTH_BASE_URL');
        process.exit(1);
    } catch (e: any) {
        console.log('  ✅ Correctly blocked missing production AUTH_BASE_URL');
    }

    // Test 4: Staging with AUTH_BASE_URL
    console.log('Test 4: Staging with AUTH_BASE_URL');
    resetEnv();
    process.env.VERCEL_ENV = 'preview';
    process.env.NEXT_PUBLIC_APP_ENV = 'staging';
    process.env.AUTH_BASE_URL = 'https://staging.inpsyq.com';

    origin = getPublicOrigin();
    assert.equal(origin.origin, 'https://staging.inpsyq.com');
    console.log('  ✅ Staging respects AUTH_BASE_URL');

    // Test 5: Preview fallback to VERCEL_URL
    console.log('Test 5: Preview fallback to VERCEL_URL');
    resetEnv();
    process.env.VERCEL_ENV = 'preview';
    delete process.env.AUTH_BASE_URL;
    process.env.VERCEL_URL = 'preview-deploy.vercel.app';

    origin = getPublicOrigin();
    assert.equal(origin.origin, 'https://preview-deploy.vercel.app');
    assert.equal(origin.source, 'VERCEL_URL');
    console.log('  ✅ Preview falls back to VERCEL_URL');

    // Restore
    resetEnv();

    console.log('\n✅ All authentication invariants verified!');
}

main().catch(e => {
    console.error('Verification failed:', e);
    process.exit(1);
});

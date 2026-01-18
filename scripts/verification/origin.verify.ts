#!/usr/bin/env npx tsx
/**
 * Origin Verification
 * 
 * Validates public origin configuration invariants:
 * - Production strict enforcement (AUTH_BASE_URL required, must be inpsyq.com)
 * - Preview/staging fallback behavior
 * - No VERCEL_URL leakage in production emails
 * 
 * Run:
 *   npx tsx scripts/verification/origin.verify.ts
 */

import { strict as assert } from 'node:assert';
import { getPublicOrigin, assertPublicOriginValid } from '../../lib/env/publicOrigin';

const originalEnv = { ...process.env };

function resetEnv() {
    process.env = { ...originalEnv };
}

async function main() {
    console.log('Origin Verification\n');

    // Test 1: Production Strict Enforcement
    console.log('Test 1: Production with correct AUTH_BASE_URL');
    resetEnv();
    process.env.VERCEL_ENV = 'production';
    process.env.AUTH_BASE_URL = 'https://www.inpsyq.com';

    let origin = getPublicOrigin();
    assert.equal(origin.origin, 'https://www.inpsyq.com', 'Origin should be inpsyq.com');
    assert.equal(origin.enforced, true, 'Should be enforced');
    assert.doesNotThrow(() => assertPublicOriginValid(), 'Should not throw');
    console.log('  ✅ Passed');

    // Test 2: Production with Wrong Domain
    console.log('Test 2: Production with wrong AUTH_BASE_URL');
    resetEnv();
    process.env.VERCEL_ENV = 'production';
    process.env.AUTH_BASE_URL = 'https://wrong-domain.com';

    try {
        assertPublicOriginValid();
        assert.fail('Should have thrown');
    } catch (e: any) {
        assert.ok(e.message.includes('ORIGIN_MISCONFIGURED'), 'Should indicate misconfiguration');
    }
    console.log('  ✅ Passed');

    // Test 3: Production Missing AUTH_BASE_URL
    console.log('Test 3: Production without AUTH_BASE_URL');
    resetEnv();
    process.env.VERCEL_ENV = 'production';
    delete process.env.AUTH_BASE_URL;

    try {
        assertPublicOriginValid();
        assert.fail('Should have thrown');
    } catch (e: any) {
        assert.ok(e.message.includes('ORIGIN_MISCONFIGURED'), 'Should indicate misconfiguration');
    }
    console.log('  ✅ Passed');

    // Test 4: Staging respects AUTH_BASE_URL
    console.log('Test 4: Staging behavior');
    resetEnv();
    process.env.VERCEL_ENV = 'preview';
    process.env.NEXT_PUBLIC_APP_ENV = 'staging';
    process.env.AUTH_BASE_URL = 'https://staging.inpsyq.com';

    origin = getPublicOrigin();
    assert.equal(origin.origin, 'https://staging.inpsyq.com', 'Should use staging URL');
    console.log('  ✅ Passed');

    // Test 5: Preview fallback to VERCEL_URL
    console.log('Test 5: Preview fallback');
    resetEnv();
    process.env.VERCEL_ENV = 'preview';
    delete process.env.AUTH_BASE_URL;
    process.env.VERCEL_URL = 'preview-abc.vercel.app';

    origin = getPublicOrigin();
    assert.equal(origin.origin, 'https://preview-abc.vercel.app', 'Should use VERCEL_URL');
    assert.equal(origin.source, 'VERCEL_URL', 'Source should be VERCEL_URL');
    console.log('  ✅ Passed');

    // Cleanup
    resetEnv();

    console.log('\n✅ All origin checks passed');
}

main().catch(e => {
    console.error('❌ Failed:', e.message);
    process.exit(1);
});

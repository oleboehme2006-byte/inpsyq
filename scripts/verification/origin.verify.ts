/**
 * Origin Verification Script
 * 
 * Tests public origin resolution invariants:
 * - Production requires AUTH_BASE_URL = https://www.inpsyq.com
 * - Wrong production domain throws error
 * - Missing production domain throws error
 * - Staging respects AUTH_BASE_URL
 * - Preview falls back to VERCEL_URL
 * 
 * Run: npx tsx scripts/verification/origin.verify.ts
 */

import { strict as assert } from 'node:assert';
import { getPublicOriginUrl, getPublicOrigin, assertPublicOriginValid } from '../../lib/env/publicOrigin';

const originalEnv = { ...process.env };

function resetEnv() {
    process.env = { ...originalEnv };
}

async function verify() {
    console.log('Origin Verification\n');

    // Test 1: Production requires correct AUTH_BASE_URL
    console.log('1. Production with correct AUTH_BASE_URL');
    resetEnv();
    process.env.VERCEL_ENV = 'production';
    process.env.AUTH_BASE_URL = 'https://www.inpsyq.com';

    let origin = getPublicOrigin();
    assert.equal(origin.origin, 'https://www.inpsyq.com');
    assert.equal(origin.enforced, true);
    assert.doesNotThrow(() => assertPublicOriginValid());
    console.log('   ✅ PASS\n');

    // Test 2: Production with wrong AUTH_BASE_URL
    console.log('2. Production with wrong domain');
    resetEnv();
    process.env.VERCEL_ENV = 'production';
    process.env.AUTH_BASE_URL = 'https://wrong-domain.com';

    try {
        assertPublicOriginValid();
        console.error('   ❌ FAIL: Should have thrown');
        process.exit(1);
    } catch (e: any) {
        console.log('   ✅ PASS: Correctly blocked wrong domain\n');
    }

    // Test 3: Production missing AUTH_BASE_URL
    console.log('3. Production missing AUTH_BASE_URL');
    resetEnv();
    process.env.VERCEL_ENV = 'production';
    delete process.env.AUTH_BASE_URL;

    try {
        assertPublicOriginValid();
        console.error('   ❌ FAIL: Should have thrown');
        process.exit(1);
    } catch (e: any) {
        console.log('   ✅ PASS: Correctly blocked missing domain\n');
    }

    // Test 4: Staging respects AUTH_BASE_URL
    console.log('4. Staging with AUTH_BASE_URL');
    resetEnv();
    process.env.VERCEL_ENV = 'preview';
    process.env.NEXT_PUBLIC_APP_ENV = 'staging';
    process.env.AUTH_BASE_URL = 'https://staging.inpsyq.com';

    origin = getPublicOrigin();
    assert.equal(origin.origin, 'https://staging.inpsyq.com');
    console.log('   ✅ PASS\n');

    // Test 5: Preview falls back to VERCEL_URL
    console.log('5. Preview fallback to VERCEL_URL');
    resetEnv();
    process.env.VERCEL_ENV = 'preview';
    delete process.env.AUTH_BASE_URL;
    process.env.VERCEL_URL = 'preview-deploy.vercel.app';

    origin = getPublicOrigin();
    assert.equal(origin.origin, 'https://preview-deploy.vercel.app');
    assert.equal(origin.source, 'VERCEL_URL');
    console.log('   ✅ PASS\n');

    console.log('All origin invariants verified ✅');
}

verify().catch(e => {
    console.error('Verification failed:', e);
    process.exit(1);
});

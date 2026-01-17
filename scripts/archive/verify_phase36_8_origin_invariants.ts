
import { strict as assert } from 'node:assert';
import { getPublicOriginUrl, getPublicOrigin, assertPublicOriginValid } from '../lib/env/publicOrigin';

// Mock process.env for testing
const originalEnv = { ...process.env };

function resetEnv() {
    process.env = { ...originalEnv };
}

async function testOriginInvariants() {
    console.log('Testing Origin Invariants...');

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
        console.log('  ✅ Correctly blocked wrong production domain:', e.message);
    }

    // Test 3: Production Missing AUTH_BASE_URL
    console.log('Test 3: Production Missing AUTH_BASE_URL');
    resetEnv();
    process.env.VERCEL_ENV = 'production';
    delete process.env.AUTH_BASE_URL;

    try {
        getPublicOrigin(); // Should throw or return invalid state that fails assertion
        assertPublicOriginValid(); // Should definitely throw
        console.error('  ❌ Should have thrown error for missing prod AUTH_BASE_URL');
        process.exit(1);
    } catch (e: any) {
        console.log('  ✅ Correctly blocked missing production domain:', e.message);
    }

    // Test 4: Staging with AUTH_BASE_URL
    console.log('Test 4: Staging behavior');
    resetEnv();
    process.env.VERCEL_ENV = 'preview'; // or staging
    process.env.NEXT_PUBLIC_APP_ENV = 'staging';
    process.env.AUTH_BASE_URL = 'https://staging.inpsyq.com';

    origin = getPublicOrigin();
    assert.equal(origin.origin, 'https://staging.inpsyq.com');
    console.log('  ✅ Staging respects AUTH_BASE_URL');

    // Test 5: Fallback to VERCEL_URL (for preview)
    console.log('Test 5: Preview fallback');
    resetEnv();
    process.env.VERCEL_ENV = 'preview';
    delete process.env.AUTH_BASE_URL;
    process.env.VERCEL_URL = 'preview-deploy.vercel.app';

    origin = getPublicOrigin();
    assert.equal(origin.origin, 'https://preview-deploy.vercel.app');
    assert.equal(origin.source, 'VERCEL_URL');
    console.log('  ✅ Preview falls back to VERCEL_URL');

    console.log('\nAll Origin Invariants Verified! ✅');
}

testOriginInvariants().catch(e => {
    console.error('Failed:', e);
    process.exit(1);
});

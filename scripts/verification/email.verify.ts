#!/usr/bin/env npx tsx
/**
 * Email Transport Verification
 * 
 * Validates magic link email generation:
 * - Uses canonical origin (not VERCEL_URL)
 * - Links to /auth/consume
 * - Token parameter present
 * - Test transport writes to outbox
 * 
 * Run:
 *   npx tsx scripts/verification/email.verify.ts
 */

import { strict as assert } from 'node:assert';
import { sendMagicLinkEmail, getTestOutbox, clearTestOutbox } from '../../services/email/transport';

async function main() {
    console.log('Email Transport Verification\n');

    // Setup test environment (NOTE: NODE_ENV not modified)
    process.env.EMAIL_PROVIDER = 'test';
    process.env.AUTH_BASE_URL = 'http://localhost:3000';
    process.env.VERCEL_ENV = 'development';

    clearTestOutbox();

    // Test 1: Send Magic Link
    console.log('Test 1: Send magic link email');
    const token = 'test-token-' + Math.random().toString(36).repeat(3);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const result = await sendMagicLinkEmail('test@example.com', token, expiresAt);
    assert.ok(result.ok, 'Send should succeed');
    console.log('  ✅ Passed');

    // Test 2: Email in outbox
    console.log('Test 2: Email captured in outbox');
    const outbox = getTestOutbox();
    assert.equal(outbox.length, 1, 'Should have 1 email');
    console.log('  ✅ Passed');

    // Test 3: Link points to /auth/consume
    console.log('Test 3: Link uses /auth/consume');
    const mail = outbox[0];
    assert.ok(mail.html.includes('/auth/consume'), 'Should link to /auth/consume');
    console.log('  ✅ Passed');

    // Test 4: Token in link
    console.log('Test 4: Token parameter present');
    assert.ok(mail.html.includes(encodeURIComponent(token)), 'Should contain encoded token');
    console.log('  ✅ Passed');

    // Test 5: Uses canonical origin
    console.log('Test 5: Uses canonical origin');
    assert.ok(mail.html.includes('http://localhost:3000'), 'Should use AUTH_BASE_URL');
    assert.ok(!mail.html.includes('vercel.app'), 'Should NOT contain vercel.app');
    console.log('  ✅ Passed');

    // Test 6: Extract and parse URL
    console.log('Test 6: URL structure valid');
    const linkMatch = mail.html.match(/href="([^"]*)"/);
    const link = linkMatch?.[1];
    assert.ok(link, 'Should extract link');

    const url = new URL(link);
    assert.equal(url.pathname, '/auth/consume', 'Pathname should be /auth/consume');
    assert.equal(url.searchParams.get('token'), token, 'Token param should match');
    console.log('  ✅ Passed');

    console.log('\n✅ All email transport checks passed');
}

main().catch(e => {
    console.error('❌ Failed:', e.message);
    process.exit(1);
});

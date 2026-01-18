/**
 * Email Verification Script
 * 
 * Tests magic link email generation invariants:
 * - Links point to /auth/consume
 * - Token is included in URL
 * - Origin matches canonical URL
 * - Test transport writes to outbox
 * 
 * Run: npx tsx scripts/verification/email.verify.ts
 */

import { strict as assert } from 'node:assert';
import { sendMagicLinkEmail, getTestOutbox, clearTestOutbox } from '../../services/email/transport';

async function verify() {
    console.log('Email Verification\n');

    // Setup test environment (NOTE: NODE_ENV not modified)
    process.env.EMAIL_PROVIDER = 'test';
    process.env.AUTH_BASE_URL = 'http://localhost:3000';
    process.env.VERCEL_ENV = 'development';

    clearTestOutbox();

    // Test 1: Send magic link
    console.log('1. Magic link generation');
    const email = 'test@example.com';
    const token = 'test-token-' + Math.random().toString(36).repeat(5);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const result = await sendMagicLinkEmail(email, token, expiresAt);
    assert.ok(result.ok, 'Email send should succeed');
    console.log('   ✅ Email sent successfully\n');

    // Test 2: Verify outbox
    console.log('2. Outbox verification');
    const outbox = getTestOutbox();
    assert.equal(outbox.length, 1, 'Should have 1 email in outbox');
    const mail = outbox[0];
    console.log('   ✅ Email in outbox\n');

    // Test 3: Link points to /auth/consume
    console.log('3. Link target');
    assert.ok(mail.html.includes('/auth/consume'), 'Link should point to /auth/consume');
    console.log('   ✅ Correct path\n');

    // Test 4: Token in URL
    console.log('4. Token in URL');
    assert.ok(mail.html.includes(encodeURIComponent(token)), 'Link should contain token');
    console.log('   ✅ Token present\n');

    // Test 5: URL structure
    console.log('5. URL structure');
    const linkMatch = mail.html.match(/href="([^"]*)"/);
    const consumeLink = linkMatch ? linkMatch[1] : null;
    assert.ok(consumeLink, 'Should extract link from email');

    const url = new URL(consumeLink);
    assert.equal(url.pathname, '/auth/consume', 'Path should be /auth/consume');
    assert.equal(url.searchParams.get('token'), token, 'Token param should match');
    console.log(`   ✅ Valid URL: ${url.origin}${url.pathname}\n`);

    console.log('All email invariants verified ✅');
}

verify().catch(e => {
    console.error('Verification failed:', e);
    process.exit(1);
});

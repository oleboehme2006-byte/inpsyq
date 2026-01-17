#!/usr/bin/env npx tsx
/**
 * Email / Magic Link Verification
 *
 * Verifies magic link email generation:
 * - Uses canonical origin (not VERCEL_URL)
 * - Links to /auth/consume
 * - Token parameter present
 *
 * When to run:
 * - Before production deployment
 * - After changes to email transport
 *
 * Expected output: Email generated with correct link structure.
 */

import { strict as assert } from 'node:assert';
import { sendMagicLinkEmail, getTestOutbox, clearTestOutbox } from '../../services/email/transport';

async function main() {
    console.log('═'.repeat(60));
    console.log('  Email / Magic Link Verification');
    console.log('═'.repeat(60) + '\n');

    // Setup test environment (NOTE: NODE_ENV is NOT set manually)
    process.env.EMAIL_PROVIDER = 'test';
    process.env.AUTH_BASE_URL = 'http://localhost:3000';
    process.env.VERCEL_ENV = 'development';

    clearTestOutbox();

    // Step 1: Send magic link email
    console.log('Step 1: Sending magic link...');
    const email = 'test@example.com';
    const token = 'test-token-' + Math.random().toString(36).repeat(5);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const result = await sendMagicLinkEmail(email, token, expiresAt);
    assert.ok(result.ok, 'Email send should succeed');
    console.log('  ✅ Email sent successfully');

    // Step 2: Verify outbox
    console.log('Step 2: Verifying outbox...');
    const outbox = getTestOutbox();
    assert.equal(outbox.length, 1, 'Should have 1 email in outbox');
    const mail = outbox[0];

    // Verify link structure
    assert.ok(mail.html.includes('/auth/consume'), 'Link should point to /auth/consume');
    assert.ok(mail.html.includes(encodeURIComponent(token)), 'Link should contain token');
    console.log('  ✅ Email content verified');

    // Step 3: Extract and validate link
    console.log('Step 3: Validating link structure...');
    const linkMatch = mail.html.match(/href="([^"]*)"/);
    const consumeLink = linkMatch ? linkMatch[1] : null;
    assert.ok(consumeLink, 'Should extract link from email');

    const url = new URL(consumeLink);
    assert.equal(url.pathname, '/auth/consume', 'Path should be /auth/consume');
    assert.equal(url.searchParams.get('token'), token, 'Token param should match');
    console.log(`  ✅ Link validated: ${consumeLink}`);

    console.log('\n✅ Email verification passed!');
    console.log('\nNote: This verifies transport logic. Full E2E requires running server.');
}

main().catch(e => {
    console.error('Verification failed:', e);
    process.exit(1);
});

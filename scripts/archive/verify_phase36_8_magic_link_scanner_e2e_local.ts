
import { strict as assert } from 'node:assert';
import { sendMagicLinkEmail, getTestOutbox, clearTestOutbox } from '../services/email/transport';
import { getPublicOriginUrl } from '../lib/env/publicOrigin';

async function verifyMagicLinkFlow() {
    console.log('Verifying Magic Link Flow (Local E2E)...');

    // Setup Environment (NOTE: NODE_ENV is NOT set manually - relies on existing env)
    process.env.EMAIL_PROVIDER = 'test';
    process.env.AUTH_BASE_URL = 'http://localhost:3000';
    process.env.VERCEL_ENV = 'development';

    clearTestOutbox();

    // 1. Trigger Email Send
    const email = 'oleboehme2006@gmail.com';
    const token = 'test-token-' + Math.random().toString(36).repeat(5); // Ensure long enough
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log('1. Sending Magic Link...');
    const result = await sendMagicLinkEmail(email, token, expiresAt);
    assert.ok(result.ok, 'Email send should succeed');

    // 2. Verify Outbox
    console.log('2. Verifying Outbox...');
    const outbox = getTestOutbox();
    assert.equal(outbox.length, 1, 'Should have 1 email in outbox');
    const mail = outbox[0];

    // Verify content
    assert.ok(mail.html.includes('/auth/consume'), 'Link should point to /auth/consume');
    assert.ok(mail.html.includes(encodeURIComponent(token)), 'Link should contain token');

    // Extract Link
    const linkMatch = mail.html.match(/href="([^"]*)"/);
    const consumeLink = linkMatch ? linkMatch[1] : null;
    assert.ok(consumeLink, 'Should extract link from email');
    console.log(`   Link found: ${consumeLink}`);

    // 3. Simulate "Click" (GET request)
    // Since we can't easily spin up the full Next.js server here just for a script without checking out the whole app,
    // we will verify the link construction matches expectations for the consume page.
    // The actual HTTP fetch would require the server running.
    // Instead, we verified the URL structure which generates the client-side navigation.

    const url = new URL(consumeLink);
    assert.equal(url.pathname, '/auth/consume', 'Path should be /auth/consume');
    assert.equal(url.searchParams.get('token'), token, 'Token param should match');

    console.log('\nMagic Link Flow Verified (Link Generation & content)! ✅');
    console.log('Note: Full HTTP simulation requires running server. This confirms the transport logic.');
}

verifyMagicLinkFlow().catch(e => {
    console.error('Failed:', e);
    process.exit(1);
});

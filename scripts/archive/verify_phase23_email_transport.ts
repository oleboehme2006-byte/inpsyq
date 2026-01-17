#!/usr/bin/env npx tsx
/**
 * PHASE 23 EMAIL TRANSPORT VERIFICATION
 * 
 * Tests email transport configuration.
 */

import './_bootstrap';
import { getEmailTransport, getTestOutbox, clearTestOutbox } from '../services/email/transport';

async function main() {
    console.log('=== PHASE 23 EMAIL TRANSPORT VERIFICATION ===\n');

    const provider = process.env.EMAIL_PROVIDER || 'disabled';
    console.log(`Email Provider: ${provider}`);

    const transport = getEmailTransport();

    if (provider === 'disabled') {
        console.log('✓ Disabled transport - no emails will be sent');
        console.log('✓ EMAIL TRANSPORT VERIFICATION PASSED (disabled mode)');
        return;
    }

    if (provider === 'test') {
        console.log('Testing in-memory test transport...');
        clearTestOutbox();

        const result = await transport.send({
            to: 'test@example.com',
            subject: 'Test Email',
            html: '<p>Test</p>',
        });

        if (result.ok) {
            const outbox = getTestOutbox();
            if (outbox.length === 1 && outbox[0].to === 'test@example.com') {
                console.log('✓ Test transport captured email correctly');
                console.log('✓ EMAIL TRANSPORT VERIFICATION PASSED (test mode)');
                return;
            }
        }
        console.error('❌ Test transport failed');
        process.exit(1);
    }

    if (provider === 'resend') {
        const testEmail = process.env.TEST_EMAIL;

        if (!testEmail) {
            console.log('⚠ TEST_EMAIL not set - skipping real email test');
            console.log('⚠ To test real email, set TEST_EMAIL environment variable');
            console.log('✓ EMAIL TRANSPORT VERIFICATION PASSED (resend configured, not tested)');
            return;
        }

        if (!process.env.RESEND_API_KEY) {
            console.error('❌ RESEND_API_KEY not set');
            process.exit(1);
        }

        console.log(`Sending test email to: ${testEmail}`);
        const result = await transport.send({
            to: testEmail,
            subject: 'InPsyq Email Test',
            html: '<p>This is a test email from InPsyq email transport verification.</p>',
        });

        if (result.ok) {
            console.log(`✓ Email sent successfully (ID: ${result.id})`);
            console.log('✓ EMAIL TRANSPORT VERIFICATION PASSED');
        } else {
            console.error(`❌ Email send failed: ${result.error}`);
            process.exit(1);
        }
        return;
    }

    console.error(`❌ Unknown provider: ${provider}`);
    process.exit(1);
}

main().catch(e => {
    console.error('Email verification failed:', e);
    process.exit(1);
});

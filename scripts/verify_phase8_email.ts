import { sendWeeklyDigest } from '@/services/email/sender';
import { clearTestOutbox, getTestOutbox } from '@/services/email/transport';
import fs from 'fs';
import path from 'path';

// Force test transport
process.env.EMAIL_PROVIDER = 'test';

async function run() {
    console.log('[Verify] Starting Phase 8 Email Verification...');

    // Clear outbox
    clearTestOutbox();

    // Send digest
    const success = await sendWeeklyDigest('test-manager@inpsyq.com', {
        teamName: 'Test Team',
        weekLabel: 'Week 12',
        strain: 45,
        engagement: 75,
        topDriver: { label: 'Cognitive Load', trend: 'worsening' },
        topAction: { title: 'Test Action', message: 'Test Message' },
        dashboardUrl: 'https://inpsyq.com/team/test'
    });

    if (!success) {
        console.error('[Verify] FAILED: sendWeeklyDigest returned false');
        process.exit(1);
    }
    console.log('[Verify] sendWeeklyDigest returned true');

    // Verify in-memory outbox
    const outbox = getTestOutbox();
    if (outbox.length !== 1) {
        console.error(`[Verify] FAILED: Expected 1 email in outbox, got ${outbox.length}`);
        process.exit(1);
    }
    console.log('[Verify] In-memory outbox checked');

    // Verify file system output
    const outboxPath = path.join(process.cwd(), 'artifacts', 'email_outbox', 'last_magic_link.json');

    // Give it a moment for FS write (though transport awaits it usually)
    await new Promise(r => setTimeout(r, 100));

    if (!fs.existsSync(outboxPath)) {
        console.error('[Verify] FAILED: Outbox file not found at', outboxPath);
        process.exit(1);
    }

    const content = JSON.parse(fs.readFileSync(outboxPath, 'utf8'));

    if (content.subject !== 'Weekly Update: Test Team (Week 12)') {
        console.error(`[Verify] FAILED: Subject mismatch. Got: "${content.subject}"`);
        process.exit(1);
    }

    // Verify text preview contains key info
    if (!content.textPreview.includes('Strain: 45%')) {
        console.error(`[Verify] FAILED: Text preview missing Strain stats. Got: "${content.textPreview}"`);
        process.exit(1);
    }

    console.log('[Verify] SUCCESS: Email verification passed');
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});

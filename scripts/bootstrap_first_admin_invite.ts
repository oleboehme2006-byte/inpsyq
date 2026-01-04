#!/usr/bin/env npx tsx
/**
 * BOOTSTRAP FIRST ADMIN INVITE
 * 
 * Creates the first admin invite for an organization.
 * Requires BOOTSTRAP_SECRET to be set.
 * 
 * Usage:
 *   BOOTSTRAP_SECRET=xxx npx tsx scripts/bootstrap_first_admin_invite.ts <email> <orgId> [baseUrl]
 */

import 'dotenv/config';

const BOOTSTRAP_SECRET = process.env.BOOTSTRAP_SECRET;

async function main() {
    const [email, orgId, baseUrl = 'http://localhost:3001'] = process.argv.slice(2);

    if (!email || !orgId) {
        console.error('Usage: npx tsx scripts/bootstrap_first_admin_invite.ts <email> <orgId> [baseUrl]');
        console.error('');
        console.error('Required env vars:');
        console.error('  BOOTSTRAP_SECRET - The secret for bootstrap endpoint');
        process.exit(1);
    }

    if (!BOOTSTRAP_SECRET) {
        console.error('ERROR: BOOTSTRAP_SECRET environment variable is required');
        process.exit(1);
    }

    console.log('=== BOOTSTRAP FIRST ADMIN INVITE ===');
    console.log(`Target: ${baseUrl}`);
    console.log(`Org ID: ${orgId}`);
    console.log('');

    try {
        const response = await fetch(`${baseUrl}/api/internal/bootstrap/first-admin-invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-bootstrap-secret': BOOTSTRAP_SECRET,
            },
            body: JSON.stringify({ email, orgId }),
        });

        const data = await response.json() as { ok?: boolean; code?: string; inviteToken?: string; message?: string };

        if (response.ok && data.ok) {
            console.log('✓ Admin invite created successfully!');
            console.log('');
            console.log('Next steps:');
            console.log('1. Request magic link at /login using the invited email');
            console.log('2. Check email for login link');
            console.log('3. Complete login to become admin');
            console.log('');
            console.log('IMPORTANT: Store this invite token securely. It expires in 7 days.');
            console.log(`Invite Token: ${data.inviteToken}`);
        } else if (data.code === 'ALREADY_BOOTSTRAPPED') {
            console.log('⚠ Organization already has an admin. No action needed.');
        } else {
            console.error('❌ Bootstrap failed:', data.message || response.statusText);
            process.exit(1);
        }

    } catch (e: any) {
        console.error('❌ Network error:', e.message);
        process.exit(1);
    }
}

main();

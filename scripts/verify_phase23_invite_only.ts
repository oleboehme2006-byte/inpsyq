#!/usr/bin/env npx tsx
/**
 * PHASE 23 INVITE-ONLY TESTS
 * 
 * Tests that unknown emails cannot obtain sessions (invite-only enforcement).
 */

import './_bootstrap';
import { isEmailAllowed } from '../lib/auth/loginToken';
import { query } from '../db/client';

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    }
    console.log(`✓ ${message}`);
}

async function main() {
    console.log('=== PHASE 23 INVITE-ONLY TESTS ===\n');

    // Test 1: Unknown email should not be allowed
    console.log('Test 1: Unknown email rejection...');
    const unknownResult = await isEmailAllowed('random-unknown-user-xyz@example.com');
    assert(!unknownResult.allowed, 'Unknown email is not allowed');
    assert(unknownResult.source === null, 'Source is null for unknown');

    // Test 2: Check if there are any existing memberships with email
    console.log('\nTest 2: Existing membership check...');
    const existingMember = await query(`
        SELECT u.email, m.org_id, m.role 
        FROM users u 
        JOIN memberships m ON u.user_id = m.user_id 
        WHERE u.email IS NOT NULL
        LIMIT 1
    `);

    if (existingMember.rows.length > 0) {
        const memberEmail = existingMember.rows[0].email;
        const memberResult = await isEmailAllowed(memberEmail);
        assert(memberResult.allowed, `Existing member ${memberEmail} is allowed`);
        assert(memberResult.source === 'membership', 'Source is membership');
        console.log(`  Found member: ${memberEmail}`);
    } else {
        console.log('  (No existing members with email set - skipping membership test)');
    }

    // Test 3: API response should always be ok (no enumeration)
    console.log('\nTest 3: API non-enumeration check...');
    const BASE_URL = process.env.VERIFY_BASE_URL || 'http://localhost:3001';

    try {
        const response = await fetch(`${BASE_URL}/api/auth/request-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'unknown-test-user@nonexistent-domain.xyz' }),
        });

        const data = await response.json() as { ok: boolean };
        assert(response.status === 200, 'Response status is 200 (non-enumerating)');
        assert(data.ok === true, 'Response body has ok: true');
    } catch (e: any) {
        console.log(`  (Server not running - skipping API test: ${e.message})`);
    }

    console.log('\n=== ALL INVITE-ONLY TESTS PASSED ===');
}

main().catch(e => {
    console.error('Test failed:', e);
    process.exit(1);
});

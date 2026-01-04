#!/usr/bin/env npx tsx
/**
 * PHASE 23 SCHEMA VERIFICATION
 * 
 * Verifies that all Phase 23 database tables and columns exist.
 */

import './_bootstrap';
import { query } from '../db/client';

interface ColumnCheck {
    table: string;
    column: string;
    required: boolean;
}

const REQUIRED_COLUMNS: ColumnCheck[] = [
    // login_tokens
    { table: 'login_tokens', column: 'id', required: true },
    { table: 'login_tokens', column: 'email', required: true },
    { table: 'login_tokens', column: 'token_hash', required: true },
    { table: 'login_tokens', column: 'expires_at', required: true },
    { table: 'login_tokens', column: 'used_at', required: true },
    { table: 'login_tokens', column: 'org_id', required: false },
    { table: 'login_tokens', column: 'role', required: false },
    { table: 'login_tokens', column: 'created_ip', required: false },

    // sessions
    { table: 'sessions', column: 'session_id', required: true },
    { table: 'sessions', column: 'user_id', required: true },
    { table: 'sessions', column: 'token_hash', required: true },
    { table: 'sessions', column: 'expires_at', required: true },
    { table: 'sessions', column: 'last_seen_at', required: false },
    { table: 'sessions', column: 'ip', required: false },
    { table: 'sessions', column: 'user_agent', required: false },

    // active_invites
    { table: 'active_invites', column: 'payload_signature', required: true },
    { table: 'active_invites', column: 'org_id', required: true },
    { table: 'active_invites', column: 'email', required: true },
    { table: 'active_invites', column: 'expires_at', required: true },
    { table: 'active_invites', column: 'max_uses', required: false },
    { table: 'active_invites', column: 'uses_count', required: false },

    // users
    { table: 'users', column: 'user_id', required: true },
    { table: 'users', column: 'email', required: true },
    { table: 'users', column: 'name', required: false },
];

async function main() {
    console.log('=== PHASE 23 SCHEMA VERIFICATION ===\n');

    let passed = 0;
    let failed = 0;
    const missing: string[] = [];

    // Get all columns from information_schema
    const result = await query(`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
    `);

    const existing = new Set(
        result.rows.map((r: { table_name: string; column_name: string }) =>
            `${r.table_name}.${r.column_name}`
        )
    );

    // Check each required column
    for (const check of REQUIRED_COLUMNS) {
        const key = `${check.table}.${check.column}`;
        const exists = existing.has(key);

        if (exists) {
            console.log(`✓ ${key}`);
            passed++;
        } else if (check.required) {
            console.log(`❌ ${key} (REQUIRED - MISSING)`);
            missing.push(key);
            failed++;
        } else {
            console.log(`⚠ ${key} (optional - missing)`);
        }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (missing.length > 0) {
        console.error(`\n❌ SCHEMA VERIFICATION FAILED`);
        console.error(`Missing required columns: ${missing.join(', ')}`);
        process.exit(1);
    }

    console.log(`\n✓ SCHEMA VERIFICATION PASSED`);
}

main().catch(e => {
    console.error('Schema verification failed:', e);
    process.exit(1);
});

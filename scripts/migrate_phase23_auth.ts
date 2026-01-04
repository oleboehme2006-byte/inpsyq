#!/usr/bin/env npx tsx
/**
 * Create auth tables for Phase 23: login_tokens + sessions
 */
import './_bootstrap';
import { query } from '../db/client';

async function main() {
    console.log('=== Phase 23 Auth Tables Migration ===');

    // 1. login_tokens table
    console.log('Creating login_tokens table...');
    await query(`
        CREATE TABLE IF NOT EXISTS login_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL,
            token_hash TEXT NOT NULL,
            org_id UUID,
            role TEXT,
            expires_at TIMESTAMPTZ NOT NULL,
            used_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            created_ip TEXT
        );
    `);

    await query(`CREATE INDEX IF NOT EXISTS idx_login_tokens_email ON login_tokens(email, expires_at);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_login_tokens_hash ON login_tokens(token_hash);`);
    console.log('✓ login_tokens table created');

    // 2. sessions table - may already exist, add missing columns
    console.log('Updating sessions table...');
    try {
        await query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS token_hash TEXT;`);
        await query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();`);
        await query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip TEXT;`);
        await query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;`);
        console.log('✓ sessions table updated');
    } catch (e: any) {
        console.log('sessions columns may already exist:', e.message);
    }

    // Create indexes if not exist
    try {
        await query(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);`);
        await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);`);
    } catch (e: any) {
        console.log('sessions indexes may already exist:', e.message);
    }
    console.log('✓ sessions indexes verified');

    // 3. Update active_invites with email column
    console.log('Updating active_invites table...');
    try {
        await query(`ALTER TABLE active_invites ADD COLUMN IF NOT EXISTS email TEXT;`);
        await query(`ALTER TABLE active_invites ADD COLUMN IF NOT EXISTS max_uses INT DEFAULT 1;`);
        await query(`ALTER TABLE active_invites ADD COLUMN IF NOT EXISTS uses_count INT DEFAULT 0;`);
        console.log('✓ active_invites table updated');
    } catch (e: any) {
        // Column might already exist
        console.log('active_invites columns may already exist:', e.message);
    }

    console.log('\n=== Migration Complete ===');
}

main().catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * Create 'active_invites' table for Phase 14C limit enforcement.
 */
import './_bootstrap';
import { query } from '../db/client';

async function main() {
    console.log('Creating active_invites table...');
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS active_invites (
                payload_signature TEXT PRIMARY KEY, -- The signature part of the token
                org_id UUID NOT NULL,
                created_by UUID,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                expires_at TIMESTAMPTZ NOT NULL
            );
        `);
        console.log('Table active_invites created.');

        await query(`
            CREATE INDEX IF NOT EXISTS idx_active_invites_org ON active_invites(org_id);
            CREATE INDEX IF NOT EXISTS idx_active_invites_expiry ON active_invites(expires_at);
        `);
        console.log('Indexes created.');

    } catch (e: any) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

main();

#!/usr/bin/env npx tsx
/**
 * Create 'audit_events' table.
 */
import './_bootstrap';
import { query } from '../db/client';

async function main() {
    console.log('Creating audit_events table...');
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS audit_events (
                event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                org_id UUID NOT NULL,
                team_id UUID,
                event_type TEXT NOT NULL,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('Table active_invites created.');

        await query(`
            CREATE INDEX IF NOT EXISTS idx_audit_org_type ON audit_events(org_id, event_type);
            CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at);
        `);
        console.log('Indexes created.');

    } catch (e: any) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

main();

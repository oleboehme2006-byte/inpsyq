#!/usr/bin/env npx tsx
/**
 * DEPLOY PHASE 15 INDEXES
 * 
 * Adds performance indexes identified during audit.
 * Idempotent: Checks existence before creating.
 */

import './_bootstrap';
import { query } from '../db/client';

const INDEXES = [
    {
        name: 'idx_weekly_products_lookup',
        table: 'org_aggregates_weekly',
        def: '(org_id, team_id, week_start)'
    },
    {
        name: 'idx_weekly_interpretations_active',
        table: 'weekly_interpretations',
        def: '(org_id, team_id, week_start, is_active)'
    },
    {
        name: 'idx_audit_events_lookup',
        table: 'audit_events',
        def: '(org_id, team_id, event_type, created_at)'
    },
    {
        name: 'idx_measurement_responses_session',
        table: 'measurement_responses',
        def: '(session_id, item_id)'
    },
    {
        name: 'idx_sessions_user_recent',
        table: 'sessions',
        def: '(user_id, started_at DESC)'
    },
    {
        name: 'idx_weekly_locks_active',
        table: 'weekly_locks',
        def: '(lock_key, status, expires_at)'
    }
];

async function main() {
    console.log('--- DEPLOY PHASE 15 INDEXES ---');

    for (const idx of INDEXES) {
        process.stdout.write(`Checking ${idx.name}... `);
        try {
            await query(`
                CREATE INDEX IF NOT EXISTS ${idx.name} 
                ON ${idx.table} ${idx.def}
            `);
            console.log('OK (Created or Exists)');
        } catch (e: any) {
            console.log('FAILED');
            console.error(e.message);
            // Don't exit, try next
        }
    }

    console.log('--- DONE ---');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});

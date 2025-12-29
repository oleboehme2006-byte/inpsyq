#!/usr/bin/env npx tsx
/**
 * VERIFY PHASE 15 INDEXES
 * 
 * Checks that required indexes exist in postgres system catalogs.
 */

import './_bootstrap';
import { query } from '../db/client';
import assert from 'assert';

const REQUIRED_INDEXES = [
    'idx_weekly_products_lookup',
    'idx_weekly_interpretations_active',
    'idx_audit_events_lookup',
    'idx_measurement_responses_session',
    'idx_sessions_user_recent',
    'idx_weekly_locks_active'
];

async function main() {
    console.log('--- VERIFY PHASE 15 INDEXES ---');

    const result = await query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public'
    `);

    const existing = new Set(result.rows.map(r => r.indexname));
    const missing: string[] = [];

    for (const req of REQUIRED_INDEXES) {
        if (existing.has(req)) {
            console.log(`[OK] ${req}`);
        } else {
            console.error(`[MISSING] ${req}`);
            missing.push(req);
        }
    }

    if (missing.length > 0) {
        console.error(`\nFAILED: ${missing.length} indexes missing.`);
        process.exit(1);
    }

    console.log('\nSUCCESS: All required indexes present.');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});

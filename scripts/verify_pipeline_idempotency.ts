#!/usr/bin/env npx tsx
/**
 * VERIFY PIPELINE IDEMPOTENCY
 * 
 * Runs pipeline twice and asserts:
 * - Row counts unchanged
 * - input_hash unchanged
 * - No duplicate week_start rows
 * 
 * Usage: npm run verify:phase6:idempotency
 */

import 'dotenv/config';
import { query } from '../db/client';
import { DEV_ORG_ID, DEV_TEAMS } from '../lib/dev/fixtures';
import { backfillTeam } from '../services/pipeline/runner';

// Guard
if (process.env.NODE_ENV === 'production') {
    console.error('❌ DEV-ONLY');
    process.exit(1);
}

interface RowSnapshot {
    weekStart: string;
    inputHash: string;
}

async function getRowSnapshots(orgId: string, teamId: string): Promise<RowSnapshot[]> {
    const result = await query(`
    SELECT week_start, input_hash
    FROM org_aggregates_weekly
    WHERE org_id = $1 AND team_id = $2
    ORDER BY week_start
  `, [orgId, teamId]);

    return result.rows.map(r => ({
        weekStart: new Date(r.week_start).toISOString().slice(0, 10),
        inputHash: r.input_hash || '',
    }));
}

async function main() {
    console.log('=== Pipeline Idempotency Verification ===\n');

    const teamId = DEV_TEAMS[0].id;

    // Run 1
    console.log('Run 1...');
    await backfillTeam(DEV_ORG_ID, teamId, 12);
    const snapshot1 = await getRowSnapshots(DEV_ORG_ID, teamId);
    console.log(`  Rows: ${snapshot1.length}`);

    // Run 2
    console.log('Run 2...');
    await backfillTeam(DEV_ORG_ID, teamId, 12);
    const snapshot2 = await getRowSnapshots(DEV_ORG_ID, teamId);
    console.log(`  Rows: ${snapshot2.length}`);

    // Assertions
    let passed = 0;
    let failed = 0;

    // Row count unchanged
    if (snapshot1.length === snapshot2.length) {
        console.log('✅ Row count unchanged');
        passed++;
    } else {
        console.error(`❌ Row count changed: ${snapshot1.length} → ${snapshot2.length}`);
        failed++;
    }

    // Check for duplicates
    const duplicates = await query(`
    SELECT week_start, COUNT(*) as c
    FROM org_aggregates_weekly
    WHERE org_id = $1 AND team_id = $2
    GROUP BY week_start
    HAVING COUNT(*) > 1
  `, [DEV_ORG_ID, teamId]);

    if (duplicates.rows.length === 0) {
        console.log('✅ No duplicate week_start rows');
        passed++;
    } else {
        console.error(`❌ Duplicate week_start rows: ${duplicates.rows.length}`);
        failed++;
    }

    // input_hash stable
    let hashMismatches = 0;
    for (let i = 0; i < Math.min(snapshot1.length, snapshot2.length); i++) {
        if (snapshot1[i].inputHash !== snapshot2[i].inputHash) {
            hashMismatches++;
        }
    }

    if (hashMismatches === 0) {
        console.log('✅ input_hash stable across runs');
        passed++;
    } else {
        console.error(`❌ input_hash changed: ${hashMismatches} mismatches`);
        failed++;
    }

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n⚠️  Idempotency verification FAILED');
        process.exit(1);
    } else {
        console.log('\n✅ Idempotency verified');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * REBUILD WEEKLY PRODUCTS (Dev)
 * 
 * Runs the idempotent pipeline for dev fixtures.
 * Usage: npm run pipeline:dev:rebuild
 */

// MUST be first import to load env before other modules
import './_bootstrap';

import { query } from '../db/client';
import { DEV_ORG_ID, DEV_TEAMS } from '../lib/dev/fixtures';
import { backfillTeam } from '../services/pipeline/runner';

// Guard: Dev only
if (process.env.NODE_ENV === 'production') {
    console.error('❌ This script is DEV-ONLY. Refusing to run in production.');
    process.exit(1);
}

async function main() {
    console.log('=== Pipeline Rebuild (Dev) ===\n');
    console.log(`ORG_ID: ${DEV_ORG_ID}`);
    console.log(`TEAMS:  ${DEV_TEAMS.map(t => t.name).join(', ')}\n`);

    let totalWeeks = 0;
    let totalUpserted = 0;

    for (const team of DEV_TEAMS) {
        console.log(`Processing ${team.name} (${team.id})...`);

        const result = await backfillTeam(DEV_ORG_ID, team.id, 12);

        console.log(`  Weeks: ${result.weeksProcessed}, Upserted: ${result.upserted}, Skipped: ${result.skipped}`);

        totalWeeks += result.weeksProcessed;
        totalUpserted += result.upserted;
    }

    console.log('\n=== Results ===\n');
    console.log(`  Total weeks processed: ${totalWeeks}`);
    console.log(`  Total upserted: ${totalUpserted}`);

    // Verify
    const verifyRes = await query(`
    SELECT COUNT(*) as count, MIN(week_start) as earliest, MAX(week_start) as latest
    FROM org_aggregates_weekly
    WHERE org_id = $1
  `, [DEV_ORG_ID]);

    const count = parseInt(verifyRes.rows[0]?.count || '0');
    const earliest = verifyRes.rows[0]?.earliest;
    const latest = verifyRes.rows[0]?.latest;

    console.log(`  Total rows in DB: ${count}`);
    if (earliest && latest) {
        console.log(`  Range: ${new Date(earliest).toISOString().slice(0, 10)} to ${new Date(latest).toISOString().slice(0, 10)}`);
    }

    console.log('\nDiagnostics endpoint:');
    console.log(`  curl -s "http://localhost:3001/api/internal/diag/pipeline?org_id=${DEV_ORG_ID}" | jq`);

    process.exit(0);
}

main().catch(err => {
    console.error('Pipeline rebuild failed:', err);
    process.exit(1);
});

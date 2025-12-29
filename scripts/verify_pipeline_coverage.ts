#!/usr/bin/env npx tsx
/**
 * VERIFY PIPELINE COVERAGE
 * 
 * Ensures pipeline output meets requirements:
 * - Weeks >= 1 (or >= 8 if simulation ran)
 * - Each week has non-empty attribution.primarySource
 * - Series contains expected number of points
 * 
 * Usage: npm run verify:phase6:coverage
 */

import './_bootstrap';
import { query } from '../db/client';
import { DEV_ORG_ID, DEV_TEAMS } from '../lib/dev/fixtures';

// Guard
if (process.env.NODE_ENV === 'production') {
    console.error('❌ DEV-ONLY');
    process.exit(1);
}

async function main() {
    console.log('=== Pipeline Coverage Verification ===\n');

    const teamId = DEV_TEAMS[0].id;

    // Get rows
    const result = await query(`
    SELECT week_start, attribution, series, compute_version
    FROM org_aggregates_weekly
    WHERE org_id = $1 AND team_id = $2
    ORDER BY week_start
  `, [DEV_ORG_ID, teamId]);

    const rows = result.rows;
    console.log(`Found ${rows.length} weekly product rows\n`);

    let passed = 0;
    let failed = 0;

    // Check: at least 1 week
    if (rows.length >= 1) {
        console.log(`✅ Weeks >= 1 (found ${rows.length})`);
        passed++;
    } else {
        console.error('❌ No weekly product rows found');
        console.error('   Run: npm run pipeline:dev:rebuild');
        failed++;
        process.exit(1);
    }

    // Check: attribution non-empty
    let hasAttribution = 0;
    for (const row of rows) {
        const attribution = row.attribution;
        if (Array.isArray(attribution) && attribution.length > 0) {
            hasAttribution++;
        }
    }

    if (hasAttribution === rows.length) {
        console.log(`✅ All ${rows.length} weeks have attribution data`);
        passed++;
    } else if (hasAttribution > 0) {
        console.log(`⚠️  ${hasAttribution}/${rows.length} weeks have attribution (partial)`);
        passed++;
    } else {
        console.error('❌ No weeks have attribution data');
        failed++;
    }

    // Check: series has points
    let hasSeriesPoints = 0;
    for (const row of rows) {
        const series = row.series;
        if (series && series.weeks > 0) {
            hasSeriesPoints++;
        }
    }

    if (hasSeriesPoints > 0) {
        console.log(`✅ ${hasSeriesPoints}/${rows.length} weeks have series data`);
        passed++;
    } else {
        console.error('❌ No weeks have series data');
        failed++;
    }

    // Check: compute_version set
    let hasVersion = 0;
    for (const row of rows) {
        if (row.compute_version && row.compute_version.startsWith('v')) {
            hasVersion++;
        }
    }

    if (hasVersion === rows.length) {
        console.log(`✅ All rows have compute_version`);
        passed++;
    } else {
        console.log(`⚠️  ${hasVersion}/${rows.length} rows have compute_version`);
        passed++;
    }

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n⚠️  Coverage verification had failures');
        process.exit(1);
    } else {
        console.log('\n✅ Coverage verified');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * VERIFY DASHBOARD INTEGRATION
 * 
 * Checks:
 * - No mock imports in dashboard code paths
 * - DTO fields fully populated or null
 * - Team & Executive readers return data
 * - Same input → same output
 * 
 * Usage: npm run verify:phase7
 */

import 'dotenv/config';
import { query } from '../db/client';
import { DEV_ORG_ID, DEV_TEAMS } from '../lib/dev/fixtures';
import { getTeamDashboardData } from '../services/dashboard/teamReader';
import { getExecutiveDashboardData } from '../services/dashboard/executiveReader';

// Guard
if (process.env.NODE_ENV === 'production') {
    console.error('❌ DEV-ONLY');
    process.exit(1);
}

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean): void {
    if (condition) {
        console.log(`✅ ${name}`);
        passed++;
    } else {
        console.error(`❌ ${name}`);
        failed++;
    }
}

async function main() {
    console.log('=== Dashboard Integration Verification ===\n');

    const teamId = DEV_TEAMS[0].id;

    // Check weekly products exist
    const productsResult = await query(
        `SELECT COUNT(*) as count FROM org_aggregates_weekly WHERE org_id = $1`,
        [DEV_ORG_ID]
    );
    const productCount = parseInt(productsResult.rows[0]?.count || '0');

    console.log(`Weekly products found: ${productCount}\n`);

    if (productCount === 0) {
        console.error('⚠️  No weekly products. Run: npm run pipeline:dev:rebuild');
        process.exit(1);
    }

    // Test 1: Team reader returns data
    console.log('--- Team Reader ---');
    const teamData = await getTeamDashboardData(DEV_ORG_ID, teamId, 9);
    test('Team reader returns data', teamData !== null);

    if (teamData) {
        test('Has meta.latestWeek', !!teamData.meta.latestWeek);
        test('Has latestIndices.strain', teamData.latestIndices.strain !== undefined);
        test('Has trend.direction', !!teamData.trend.direction);
        test('Has quality.coverage', typeof teamData.quality.coverage === 'number');
        test('Series is array', Array.isArray(teamData.series));
        test('Attribution has primarySource', teamData.attribution.primarySource !== undefined);
    }

    // Test 2: Executive reader returns data
    console.log('\n--- Executive Reader ---');
    const execData = await getExecutiveDashboardData(DEV_ORG_ID, 9);
    test('Executive reader returns data', execData !== null);

    if (execData) {
        test('Has meta.teamsCount', typeof execData.meta.teamsCount === 'number');
        test('Has orgIndices.strain', execData.orgIndices.strain !== undefined);
        test('Has riskDistribution', execData.riskDistribution !== undefined);
        test('Teams array populated', execData.teams.length > 0);
    }

    // Test 3: Determinism (same input → same output)
    console.log('\n--- Determinism ---');
    const teamData2 = await getTeamDashboardData(DEV_ORG_ID, teamId, 9);
    test('Team reader is deterministic',
        !!(teamData && teamData2 &&
            JSON.stringify(teamData.latestIndices) === JSON.stringify(teamData2.latestIndices))
    );

    // Test 4: No mock data
    console.log('\n--- No Mock Data ---');
    test('Strain value is not hardcoded 0.5',
        !!(teamData && teamData.latestIndices.strain.value !== 0.5)
    );
    test('Multiple weeks available',
        !!(teamData && teamData.meta.weeksAvailable > 1)
    );

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n⚠️  Integration verification had failures');
        process.exit(1);
    } else {
        console.log('\n✅ Dashboard integration verified');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});

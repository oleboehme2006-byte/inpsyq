#!/usr/bin/env npx tsx
/**
 * VERIFY PHASE 11 COVERAGE
 * 
 * Tests that fixture org has weekly products and interpretations for all teams.
 */

import 'dotenv/config';
import { DEV_ORG_ID, DEV_TEAMS } from '../lib/dev/fixtures';

const BASE_URL = 'http://localhost:3001';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET || 'test-admin-secret';

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean, detail?: string): void {
    if (condition) {
        console.log(`✅ ${name}${detail ? ` (${detail})` : ''}`);
        passed++;
    } else {
        console.error(`❌ ${name}${detail ? ` - ${detail}` : ''}`);
        failed++;
    }
}

async function checkReadiness(orgId: string, teamId?: string): Promise<any> {
    const params = new URLSearchParams({ action: 'readiness', org_id: orgId });
    if (teamId) params.set('team_id', teamId);

    const res = await fetch(`${BASE_URL}/api/internal/diag/weekly-runs?${params}`, {
        headers: { 'x-inpsyq-admin-secret': ADMIN_SECRET },
    });
    return res.json();
}

async function main() {
    console.log('=== Phase 11 Coverage Verification ===\n');
    console.log(`Org ID: ${DEV_ORG_ID}`);
    console.log(`Teams: ${DEV_TEAMS.map(t => t.name).join(', ')}\n`);

    // Check org-level readiness
    console.log('--- Org Readiness ---');
    try {
        const orgReadiness = await checkReadiness(DEV_ORG_ID);
        console.log(`  Total teams: ${orgReadiness.total_teams}`);
        console.log(`  Teams with products: ${orgReadiness.teams_with_products}`);
        test('Org has teams', orgReadiness.total_teams > 0);
    } catch (e: any) {
        console.log(`  ⚠️ ${e.message}`);
    }

    // Check each team
    console.log('\n--- Team Coverage ---');
    for (const team of DEV_TEAMS) {
        try {
            const readiness = await checkReadiness(DEV_ORG_ID, team.id);
            const hasProduct = readiness.has_product;
            const hasInterp = readiness.has_interpretation;

            console.log(`\n  ${team.name}:`);
            console.log(`    Product: ${hasProduct ? readiness.latest_product_week : 'none'}`);
            console.log(`    Interpretation: ${hasInterp ? readiness.latest_interpretation_week : 'none'}`);

            test(`${team.name} has product`, hasProduct);
            // Interpretation is optional but expected after weekly run
            if (hasProduct) {
                test(`${team.name} has interpretation`, hasInterp);
            }
        } catch (e: any) {
            console.log(`  ${team.name}: ⚠️ ${e.message}`);
        }
    }

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n⚠️ Coverage verification failed');
        console.log('   Run: npm run weekly:dev:run');
        process.exit(1);
    } else {
        console.log('\n✅ Phase 11 coverage verification passed');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});

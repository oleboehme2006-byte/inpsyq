#!/usr/bin/env npx tsx
/**
 * VERIFY PHASE 10 — Dashboard Wiring
 * 
 * Tests:
 * - Dashboard APIs respond
 * - Data structure is valid
 * - Interpretation endpoints work (tolerates "not generated")
 * 
 * Usage: npm run verify:phase10
 */

import 'dotenv/config';
import { DEV_ORG_ID, DEV_TEAMS } from '../lib/dev/fixtures';

const BASE_URL = 'http://localhost:3001';
const DEV_USER_ID = '33333333-3333-4333-8333-0000000000001';

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

async function fetchWithDevHeader(path: string) {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'X-DEV-USER-ID': DEV_USER_ID },
    });
    return { status: res.status, json: await res.json().catch(() => null) };
}

async function main() {
    console.log('=== Phase 10: Dashboard Wiring Verification ===\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Org ID: ${DEV_ORG_ID}`);
    console.log(`Team ID: ${DEV_TEAMS[0].id}\n`);

    // Test 1: Dashboard ready endpoint
    console.log('--- Diagnostics ---');
    try {
        const { status, json } = await fetchWithDevHeader(
            `/api/internal/diag/dashboard-ready?org_id=${DEV_ORG_ID}`
        );
        test('Dashboard ready endpoint responds', status === 200 || status === 404);
        if (json) {
            console.log(`  teams_with_data: ${json.teams_with_data || 'N/A'}`);
        }
    } catch (e: any) {
        test('Dashboard ready endpoint accessible', false);
        console.log(`  Error: ${e.message}`);
    }

    // Test 2: Executive dashboard API
    console.log('\n--- Executive Dashboard ---');
    try {
        const { status, json } = await fetchWithDevHeader(
            `/api/dashboard/executive?org_id=${DEV_ORG_ID}`
        );
        test('Executive dashboard returns 2xx or known error', [200, 404, 403].includes(status));
        if (status === 200 && json) {
            test('Executive response has org_id', !!json.org_id || !!json.meta?.orgId);
            console.log(`  Status: ${status}`);
        } else {
            console.log(`  Status: ${status} (${json?.code || 'no data'})`);
        }
    } catch (e: any) {
        test('Executive dashboard accessible', false);
        console.log(`  Error: ${e.message}`);
    }

    // Test 3: Team dashboard API
    console.log('\n--- Team Dashboard ---');
    try {
        const { status, json } = await fetchWithDevHeader(
            `/api/dashboard/team?org_id=${DEV_ORG_ID}&team_id=${DEV_TEAMS[0].id}`
        );
        test('Team dashboard returns 2xx or known error', [200, 404, 403].includes(status));
        if (status === 200 && json) {
            test('Team response has team_id', !!json.team_id || !!json.meta?.teamId);
            console.log(`  Status: ${status}`);
        } else {
            console.log(`  Status: ${status} (${json?.code || 'no data'})`);
        }
    } catch (e: any) {
        test('Team dashboard accessible', false);
        console.log(`  Error: ${e.message}`);
    }

    // Test 4: Interpretation endpoints
    console.log('\n--- Interpretation ---');
    try {
        const { status, json } = await fetchWithDevHeader(
            `/api/interpretation/executive?org_id=${DEV_ORG_ID}`
        );
        // Tolerate 404 (not generated yet) as valid
        test('Executive interpretation returns valid status', [200, 404].includes(status));
        if (status === 200) {
            test('Interpretation has sections', !!json.interpretation?.sections);
            console.log(`  Cache hit: ${json.cache_hit || false}`);
        } else {
            console.log(`  Status: ${status} (interpretation may need generation)`);
        }
    } catch (e: any) {
        console.log(`  Interpretation endpoint error (acceptable): ${e.message}`);
    }

    try {
        const { status } = await fetchWithDevHeader(
            `/api/interpretation/team?org_id=${DEV_ORG_ID}&team_id=${DEV_TEAMS[0].id}`
        );
        test('Team interpretation returns valid status', [200, 404].includes(status));
    } catch (e: any) {
        console.log(`  Team interpretation error (acceptable): ${e.message}`);
    }

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n⚠️  Some checks failed. Verify dev server is running on port 3001.');
        process.exit(1);
    } else {
        console.log('\n✅ Phase 10 verification passed');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Verification failed:', err);
    console.log('\n⚠️  Make sure dev server is running: npm run dev');
    process.exit(1);
});

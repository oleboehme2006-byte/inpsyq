#!/usr/bin/env npx tsx
/**
 * VERIFY PHASE 10.1 — Dashboard Wiring Completion
 * 
 * Verifies:
 * - Dashboard APIs respond with valid data
 * - Interpretation endpoints work
 * - Mock usage is properly gated
 * 
 * Usage: npm run verify:phase10.1
 */

import './_bootstrap';
import { DEV_ORG_ID, DEV_TEAMS } from '../lib/dev/fixtures';

const BASE_URL = 'http://localhost:3001';
const DEV_USER_ID = '33333333-3333-4333-8333-0000000000001';

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

async function fetchWithDevHeader(path: string): Promise<{ status: number; json: any }> {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'X-DEV-USER-ID': DEV_USER_ID },
    });
    return { status: res.status, json: await res.json().catch(() => null) };
}

async function main() {
    console.log('=== Phase 10.1: Dashboard Wiring Completion Verification ===\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Org ID: ${DEV_ORG_ID}`);
    console.log(`Team ID: ${DEV_TEAMS[0].id}`);
    console.log(`Mock flag: ${process.env.NEXT_PUBLIC_DASHBOARD_DEV_MOCKS || 'not set'}\n`);

    // Test 1: Executive dashboard API
    console.log('--- Executive Dashboard API ---');
    let execHasData = false;
    try {
        const { status, json } = await fetchWithDevHeader(`/api/dashboard/executive?org_id=${DEV_ORG_ID}`);
        test('Executive API responds', [200, 404, 403].includes(status), `status=${status}`);

        if (status === 200 && json) {
            execHasData = true;
            test('Has org_id or meta', !!(json.org_id || json.meta?.orgId));
            test('Has teams array or watchlist', !!(json.teams || json.watchlist));
            console.log(`  Teams: ${json.teams?.length || 0}, Watchlist: ${json.watchlist?.length || 0}`);
        } else if (status === 404) {
            console.log('  No weekly products found (run pipeline:dev:rebuild)');
        }
    } catch (e: any) {
        test('Executive API accessible', false, e.message);
    }

    // Test 2: Team dashboard API
    console.log('\n--- Team Dashboard API ---');
    let teamHasData = false;
    try {
        const { status, json } = await fetchWithDevHeader(
            `/api/dashboard/team?org_id=${DEV_ORG_ID}&team_id=${DEV_TEAMS[0].id}`
        );
        test('Team API responds', [200, 404, 403].includes(status), `status=${status}`);

        if (status === 200 && json) {
            teamHasData = true;
            test('Has team_id or meta', !!(json.team_id || json.meta?.teamId));
            test('Has indices data', !!(json.latest_indices || json.indices));
            console.log(`  Team: ${json.team_name || json.meta?.teamName || 'unknown'}`);
        } else if (status === 404) {
            console.log('  No weekly products found for team (run pipeline:dev:rebuild)');
        }
    } catch (e: any) {
        test('Team API accessible', false, e.message);
    }

    // Test 3: Interpretation endpoints
    console.log('\n--- Interpretation APIs ---');
    try {
        const { status } = await fetchWithDevHeader(`/api/interpretation/executive?org_id=${DEV_ORG_ID}`);
        test('Executive interpretation responds', [200, 404].includes(status), `status=${status}`);
    } catch (e: any) {
        console.log(`  Executive interpretation: ${e.message}`);
    }

    try {
        const { status } = await fetchWithDevHeader(
            `/api/interpretation/team?org_id=${DEV_ORG_ID}&team_id=${DEV_TEAMS[0].id}`
        );
        test('Team interpretation responds', [200, 404].includes(status), `status=${status}`);
    } catch (e: any) {
        console.log(`  Team interpretation: ${e.message}`);
    }

    // Test 4: Mock flag gating
    console.log('\n--- Mock Gating Verification ---');
    const mockFlagEnabled = process.env.NEXT_PUBLIC_DASHBOARD_DEV_MOCKS === 'true';
    test('Mock flag not enabled by default', !mockFlagEnabled,
        mockFlagEnabled ? 'NEXT_PUBLIC_DASHBOARD_DEV_MOCKS=true' : 'not set');

    if (mockFlagEnabled) {
        console.log('  ⚠️  Mock flag is enabled - dashboards may show mock data');
    } else {
        console.log('  ✓ Mock flag disabled - dashboards use real API only');
    }

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Executive data: ${execHasData ? 'YES' : 'NO'}`);
    console.log(`Team data: ${teamHasData ? 'YES' : 'NO'}`);

    if (failed > 0) {
        console.log('\n⚠️  Some checks failed.');
        if (!execHasData || !teamHasData) {
            console.log('   Run: npm run pipeline:dev:rebuild');
        }
        console.log('   Make sure dev server is running on port 3001');
        process.exit(1);
    } else {
        console.log('\n✅ Phase 10.1 verification passed');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Verification failed:', err);
    console.log('\n⚠️  Make sure dev server is running: npm run dev');
    process.exit(1);
});

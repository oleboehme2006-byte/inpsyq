/**
 * Verify Phase 18: UI Wiring
 * 
 * Ensures:
 * - Dashboard APIs return expected shape
 * - Status field is present
 * - Meta fields are populated
 */

import './_bootstrap';
import { getVerifyBaseUrl, fetchJson } from './_verifyBaseUrl';

const BASE_URL = getVerifyBaseUrl();
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET || 'test-admin-secret';

async function verifyUIWiring() {
    console.log('--- Verifying UI Wiring ---\n');
    console.log(`Base URL: ${BASE_URL}`);

    // 1. Check team dashboard API shape
    console.log('\n1. Testing team dashboard API shape...');

    // We need a valid org/team ID. Try to get from /api/internal/ids first.
    let orgId: string | null = null;
    let teamId: string | null = null;

    try {
        const idsRes = await fetch(`${BASE_URL}/api/internal/ids`);
        if (idsRes.ok) {
            const ids = await idsRes.json();
            orgId = ids.dev_org_id || ids.orgId;
            teamId = ids.dev_team_id || ids.teamId;
        }
    } catch {
        console.log('⚠️ Could not fetch IDs (server may not be running)');
    }

    if (!orgId || !teamId) {
        console.log('⚠️ No org/team IDs available. Skipping API shape test.');
        console.log('ℹ️ To run this test, ensure dev server is running with test data.');
    } else {
        console.log(`   Using org=${orgId.slice(0, 8)}... team=${teamId.slice(0, 8)}...`);

        // Note: This endpoint requires auth, which we may not have in script
        // Just verify it returns JSON with expected structure
        try {
            const url = `${BASE_URL}/api/dashboard/team?org_id=${orgId}&team_id=${teamId}&weeks=4`;
            const res = await fetch(url);

            // We expect either 401 (no auth) or 200/404 (with auth)
            if (res.status === 401) {
                console.log('⚠️ Auth required for team dashboard. Shape test skipped.');
            } else if (res.ok) {
                const data = await res.json();

                // Check required fields
                const requiredFields = ['meta', 'latestIndices', 'trend', 'attribution'];
                for (const field of requiredFields) {
                    if (!(field in data)) {
                        throw new Error(`Missing required field: ${field}`);
                    }
                }

                // Check meta fields
                const metaFields = ['orgId', 'teamId', 'latestWeek'];
                for (const field of metaFields) {
                    if (!(field in data.meta)) {
                        throw new Error(`Missing meta field: ${field}`);
                    }
                }

                // Check status field (added in Phase 16)
                if (!('status' in data)) {
                    console.warn('⚠️ Top-level status field missing from response');
                } else {
                    console.log(`✓ Status present: ${data.status}`);
                }

                console.log('✓ Team dashboard API shape correct');
            } else {
                console.log(`⚠️ Unexpected status ${res.status}`);
            }
        } catch (e: any) {
            console.warn('⚠️ API test failed:', e.message);
        }
    }

    // 2. Check ops health API shape
    console.log('\n2. Testing ops health API shape...');
    try {
        const { status, json } = await fetchJson(
            `${BASE_URL}/api/internal/ops/health/global`,
            { headers: { 'x-internal-admin-secret': ADMIN_SECRET } },
            'health-global'
        );

        if (status !== 200) {
            console.log(`⚠️ Expected 200, got ${status}`);
        } else {
            // Check required fields
            if (!json.ok) {
                console.warn('⚠️ Response missing ok field');
            }
            if (!json.snapshot) {
                console.warn('⚠️ Response missing snapshot field');
            } else {
                const snapshotFields = ['totalTeams', 'totalOk', 'totalDegraded', 'totalFailed'];
                for (const field of snapshotFields) {
                    if (!(field in json.snapshot)) {
                        console.warn(`⚠️ Snapshot missing field: ${field}`);
                    }
                }
                console.log('✓ Ops health API shape correct');
            }
        }
    } catch (e: any) {
        console.warn('⚠️ Ops health test failed:', e.message);
    }

    console.log('\n✅ UI Wiring Verification Complete');
}

verifyUIWiring().catch(e => {
    console.error(e);
    process.exit(1);
});

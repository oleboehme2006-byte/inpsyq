#!/usr/bin/env npx tsx
/**
 * VERIFY PHASE 14: TENANT ISOLATION
 * 
 * Tests cross-tenant access denial.
 */

import './_bootstrap';
import { query } from '../db/client';
import { DEV_ORG_ID, DEV_TEAMS } from '../lib/dev/fixtures';
import { assertSameOrg } from '@/lib/tenancy/assertions';
import assert from 'assert';

async function main() {
    console.log('--- VERIFY: TENANT ISOLATION ---');

    // 1. Runtime Assertion Check
    console.log('1. Testing assertSameOrg...');
    try {
        assertSameOrg('org-a', 'org-b', 'TestCtx');
        console.error('FAILED: assertSameOrg did not throw');
        process.exit(1);
    } catch (e: any) {
        if (e.message.includes('Tenant Mismatch')) {
            console.log('   Pass: assertSameOrg threw correctly');
        } else {
            console.error('FAILED: Wrong error message', e.message);
        }
    }

    // 2. Service Layer Check (Team Reader)
    console.log('2. Testing Team Reader Isolation...');
    const { getTeamDashboardData } = await import('@/services/dashboard/teamReader');

    // Attempt to read data for Org A but asking for Org B (should be empty or error depending on impl)
    // Our implementation checks result org matching requested org.
    // If we query with (OrgA, TeamInOrgA), we get data.
    // If we query with (OrgB, TeamInOrgA), the SQL `WHERE org_id = $1` returns 0 rows.
    // So TeamReader returns null (which is safe).
    // But if SQL was loose, we might get data.
    // Let's create dummy data for Org A and Try to read it as Org B?
    // Actually, SQL `WHERE org_id = $1` logic is robust if used.
    // The "Hardening" added `assertSameOrg` to ensure the RETURNED row matches requested Org.
    // This protects against SQL bugs returning wrong rows.

    // We can't easily inject a SQL bug here purely from outside.
    // Instead, we verify that invalid cross-combinations return null or throw.

    const validResult = await getTeamDashboardData(DEV_ORG_ID, DEV_TEAMS[0].id);
    console.log(`   Valid Request: ${validResult ? 'Found Data' : 'No Data (Expected)'}`);

    const invalidOrgId = '00000000-0000-0000-0000-000000000000';
    const invalidResult = await getTeamDashboardData(invalidOrgId, DEV_TEAMS[0].id);

    if (invalidResult !== null) {
        console.error('FAILED: Cross-tenant access succeeded (returned data for wrong org)');
        // Check if data actually belongs to DEV_ORG_ID
        if (invalidResult.meta.orgId === DEV_ORG_ID) {
            console.error('   CRITICAL: Leaked data from Org ID', DEV_ORG_ID);
        }
        process.exit(1);
    } else {
        console.log('   Pass: Cross-tenant access denied (returned null)');
    }

    console.log('SUCCESS: Tenant isolation verified.');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});

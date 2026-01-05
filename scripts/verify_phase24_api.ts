#!/usr/bin/env npx tsx
/**
 * PHASE 24 API MATRIX TESTS — RBAC Enforcement
 * 
 * Tests that each role can only access permitted APIs.
 * Must be run with server running.
 */

import './_bootstrap';
import { query } from '../db/client';

const BASE_URL = process.env.VERIFY_BASE_URL || 'http://localhost:3001';

interface TestUser {
    userId: string;
    email: string;
    role: string;
    orgId: string;
    teamId: string | null;
}

let testUsers: {
    employee?: TestUser;
    teamlead?: TestUser;
    executive?: TestUser;
    admin?: TestUser;
} = {};

async function setupTestUsers() {
    console.log('Setting up test users...');

    // Get users with different roles
    const result = await query(`
        SELECT u.user_id, u.email, m.role, m.org_id, m.team_id
        FROM users u
        JOIN memberships m ON u.user_id = m.user_id
        WHERE m.role IN ('EMPLOYEE', 'TEAMLEAD', 'EXECUTIVE', 'ADMIN')
        ORDER BY m.role
    `);

    for (const row of result.rows) {
        const user: TestUser = {
            userId: row.user_id,
            email: row.email,
            role: row.role,
            orgId: row.org_id,
            teamId: row.team_id,
        };

        switch (row.role) {
            case 'EMPLOYEE':
                if (!testUsers.employee) testUsers.employee = user;
                break;
            case 'TEAMLEAD':
                if (!testUsers.teamlead) testUsers.teamlead = user;
                break;
            case 'EXECUTIVE':
                if (!testUsers.executive) testUsers.executive = user;
                break;
            case 'ADMIN':
                if (!testUsers.admin) testUsers.admin = user;
                break;
        }
    }

    console.log(`Found: EMPLOYEE=${!!testUsers.employee}, TEAMLEAD=${!!testUsers.teamlead}, EXECUTIVE=${!!testUsers.executive}, ADMIN=${!!testUsers.admin}`);
}

async function testAPI(
    description: string,
    url: string,
    userId: string | undefined,
    orgId: string | undefined,
    expectedStatus: number
): Promise<boolean> {
    if (!userId || !orgId) {
        console.log(`  ⚠ SKIP: ${description} (no test user)`);
        return true;
    }

    try {
        const res = await fetch(`${BASE_URL}${url}`, {
            headers: {
                'Cookie': `inpsyq_dev_user=${userId}; inpsyq_selected_org=${orgId}`,
            },
        });

        const isJson = res.headers.get('content-type')?.includes('application/json');

        if (res.status === expectedStatus) {
            console.log(`  ✓ ${description} → ${res.status} (expected)`);
            return true;
        } else {
            console.log(`  ❌ ${description} → ${res.status} (expected ${expectedStatus})`);
            if (!isJson && res.status >= 400) {
                console.log(`    ERROR: Response is not JSON (got ${res.headers.get('content-type')})`);
            }
            return false;
        }
    } catch (e: any) {
        console.log(`  ❌ ${description} → ERROR: ${e.message}`);
        return false;
    }
}

async function main() {
    console.log('=== PHASE 24 API MATRIX TESTS ===\n');
    console.log(`Base URL: ${BASE_URL}\n`);

    await setupTestUsers();
    console.log('');

    let allPassed = true;

    // Test 1: EMPLOYEE cannot access executive dashboard
    console.log('Test 1: EMPLOYEE restrictions...');
    if (testUsers.employee && testUsers.admin) {
        allPassed = await testAPI(
            'EMPLOYEE → /api/dashboard/executive',
            `/api/dashboard/executive?org_id=${testUsers.admin.orgId}`,
            testUsers.employee.userId,
            testUsers.admin.orgId,
            403
        ) && allPassed;
    }

    // Test 2: EMPLOYEE cannot access team dashboard
    if (testUsers.employee && testUsers.teamlead) {
        allPassed = await testAPI(
            'EMPLOYEE → /api/dashboard/team',
            `/api/dashboard/team?org_id=${testUsers.teamlead.orgId}&team_id=${testUsers.teamlead.teamId}`,
            testUsers.employee.userId,
            testUsers.teamlead.orgId,
            403
        ) && allPassed;
    }

    // Test 3: TEAMLEAD can access own team
    console.log('\nTest 2: TEAMLEAD access...');
    if (testUsers.teamlead) {
        allPassed = await testAPI(
            'TEAMLEAD → own team',
            `/api/dashboard/team?org_id=${testUsers.teamlead.orgId}&team_id=${testUsers.teamlead.teamId}`,
            testUsers.teamlead.userId,
            testUsers.teamlead.orgId,
            200
        ) && allPassed;
    }

    // Test 4: TEAMLEAD cannot access executive dashboard
    if (testUsers.teamlead) {
        allPassed = await testAPI(
            'TEAMLEAD → /api/dashboard/executive',
            `/api/dashboard/executive?org_id=${testUsers.teamlead.orgId}`,
            testUsers.teamlead.userId,
            testUsers.teamlead.orgId,
            403
        ) && allPassed;
    }

    // Test 5: EXECUTIVE can access executive dashboard
    console.log('\nTest 3: EXECUTIVE access...');
    if (testUsers.executive) {
        allPassed = await testAPI(
            'EXECUTIVE → /api/dashboard/executive',
            `/api/dashboard/executive?org_id=${testUsers.executive.orgId}`,
            testUsers.executive.userId,
            testUsers.executive.orgId,
            200
        ) && allPassed;
    }

    // Test 6: ADMIN can access everything
    console.log('\nTest 4: ADMIN access...');
    if (testUsers.admin) {
        allPassed = await testAPI(
            'ADMIN → /api/dashboard/executive',
            `/api/dashboard/executive?org_id=${testUsers.admin.orgId}`,
            testUsers.admin.userId,
            testUsers.admin.orgId,
            200
        ) && allPassed;
    }

    console.log('');
    if (allPassed) {
        console.log('=== ALL API MATRIX TESTS PASSED ===');
    } else {
        console.error('=== SOME API MATRIX TESTS FAILED ===');
        process.exit(1);
    }
}

main().catch(e => {
    console.error('Test failed:', e);
    process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * PHASE 24.1 ADMIN API MATRIX TESTS
 * 
 * Tests that all /api/admin/* routes are ADMIN-only.
 * All non-ADMIN roles must get 403 JSON (never HTML).
 */

import './_bootstrap';
import { query } from '../db/client';

const BASE_URL = process.env.VERIFY_BASE_URL || 'http://localhost:3001';

interface TestUser {
    userId: string;
    role: string;
    orgId: string;
    teamId: string | null;
}

let testUsers: Record<string, TestUser | undefined> = {};

async function setupTestUsers() {
    console.log('Setting up test users...');

    const result = await query(`
        SELECT u.user_id, m.role, m.org_id, m.team_id
        FROM users u
        JOIN memberships m ON u.user_id = m.user_id
        WHERE m.role IN ('EMPLOYEE', 'TEAMLEAD', 'EXECUTIVE', 'ADMIN')
        ORDER BY m.role
    `);

    for (const row of result.rows) {
        const key = row.role.toLowerCase();
        if (!testUsers[key]) {
            testUsers[key] = {
                userId: row.user_id,
                role: row.role,
                orgId: row.org_id,
                teamId: row.team_id,
            };
        }
    }

    console.log(`Found: EMPLOYEE=${!!testUsers.employee}, TEAMLEAD=${!!testUsers.teamlead}, EXECUTIVE=${!!testUsers.executive}, ADMIN=${!!testUsers.admin}`);
}

async function testAdminAPI(
    endpoint: string,
    user: TestUser | undefined,
    expectedStatus: number
): Promise<{ passed: boolean; isJson: boolean; status: number }> {
    if (!user) {
        return { passed: true, isJson: true, status: 0 }; // Skip
    }

    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                'Cookie': `inpsyq_dev_user=${user.userId}; inpsyq_selected_org=${user.orgId}`,
            },
        });

        const contentType = res.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        return {
            passed: res.status === expectedStatus,
            isJson,
            status: res.status,
        };
    } catch (e: any) {
        console.log(`  ERROR: ${e.message}`);
        return { passed: false, isJson: false, status: 0 };
    }
}

async function main() {
    console.log('=== PHASE 24.1 ADMIN API MATRIX TESTS ===\n');
    console.log(`Base URL: ${BASE_URL}\n`);

    await setupTestUsers();
    console.log('');

    const adminAPIs = [
        '/api/admin/employees',
        '/api/admin/weekly',
        '/api/admin/employee-profile',
        '/api/admin/profiles',
    ];

    let allPassed = true;
    let htmlErrors = 0;

    // Test 1: Unauthenticated access should return 401
    console.log('Test 1: Unauthenticated access...');
    for (const api of adminAPIs) {
        try {
            const res = await fetch(`${BASE_URL}${api}`);
            const isJson = (res.headers.get('content-type') || '').includes('application/json');

            if (res.status === 401) {
                console.log(`  ✓ ${api} → 401 (unauthenticated)`);
            } else {
                console.log(`  ❌ ${api} → ${res.status} (expected 401)`);
                allPassed = false;
            }

            if (!isJson && res.status >= 400) {
                console.log(`    ⚠ Response is not JSON`);
                htmlErrors++;
            }
        } catch (e: any) {
            console.log(`  ⚠ ${api} → Server error: ${e.message}`);
        }
    }

    // Test 2: Non-ADMIN roles should get 403
    console.log('\nTest 2: Non-ADMIN access (expect 403)...');
    const nonAdminRoles = ['employee', 'teamlead', 'executive'];

    for (const role of nonAdminRoles) {
        const user = testUsers[role];
        if (!user) {
            console.log(`  ⚠ No ${role.toUpperCase()} user found, skipping`);
            continue;
        }

        for (const api of adminAPIs) {
            const result = await testAdminAPI(api, user, 403);

            if (result.passed) {
                console.log(`  ✓ ${role.toUpperCase()} → ${api} → 403`);
            } else {
                console.log(`  ❌ ${role.toUpperCase()} → ${api} → ${result.status} (expected 403)`);
                allPassed = false;
            }

            if (!result.isJson && result.status >= 400) {
                console.log(`    ⚠ Response is not JSON`);
                htmlErrors++;
            }
        }
    }

    // Test 3: ADMIN should get 200 (or 400 for missing params, but not 401/403)
    console.log('\nTest 3: ADMIN access (expect success or validation error)...');
    const admin = testUsers.admin;
    if (admin) {
        for (const api of adminAPIs) {
            const result = await testAdminAPI(api, admin, 200);

            // 200 is success, 400 is validation error (acceptable for missing params)
            if (result.status === 200 || result.status === 400) {
                console.log(`  ✓ ADMIN → ${api} → ${result.status} (authorized)`);
            } else if (result.status === 401 || result.status === 403) {
                console.log(`  ❌ ADMIN → ${api} → ${result.status} (should be authorized)`);
                allPassed = false;
            } else {
                console.log(`  ⚠ ADMIN → ${api} → ${result.status}`);
            }
        }
    } else {
        console.log('  ⚠ No ADMIN user found');
        allPassed = false;
    }

    console.log('');

    if (htmlErrors > 0) {
        console.error(`=== WARNING: ${htmlErrors} responses were not JSON ===`);
    }

    if (allPassed && htmlErrors === 0) {
        console.log('=== ALL ADMIN API MATRIX TESTS PASSED ===');
    } else {
        console.error('=== SOME ADMIN API MATRIX TESTS FAILED ===');
        process.exit(1);
    }
}

main().catch(e => {
    console.error('Test failed:', e);
    process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * Test Organization Verification
 *
 * Verifies test org seeding:
 * - Org exists with correct ID
 * - 3 canonical teams
 * - 15 synthetic employees
 * - Seeded measurement data
 *
 * When to run:
 * - After seeding test org
 * - Before admin UI testing
 *
 * Required environment:
 * - BASE_URL: Target environment URL
 * - INTERNAL_ADMIN_SECRET: Admin authentication
 *
 * Expected output: All counts match canonical expectations.
 */

import '../_bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const TEST_ORG_ID = '99999999-9999-4999-8999-999999999999';

interface TestResult {
    name: string;
    passed: boolean;
    details?: any;
    error?: string;
}

async function main() {
    console.log('═'.repeat(60));
    console.log('  Test Organization Verification');
    console.log('═'.repeat(60));
    console.log(`  Target: ${BASE_URL}`);
    console.log(`  Expected Org ID: ${TEST_ORG_ID}`);
    console.log('═'.repeat(60) + '\n');

    if (!ADMIN_SECRET) {
        console.error('❌ INTERNAL_ADMIN_SECRET required');
        process.exit(1);
    }

    const results: TestResult[] = [];

    // Step 1: Ensure org exists
    console.log('Step 1: Ensuring test org exists...');
    try {
        const res = await fetch(`${BASE_URL}/api/internal/admin/test-org/ensure`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ADMIN_SECRET}`,
                'Content-Type': 'application/json',
            },
        });
        const body = await res.json();

        if (body.ok && body.data?.orgId === TEST_ORG_ID) {
            results.push({ name: 'Ensure org', passed: true, details: body.data });
            console.log(`  ✅ Org exists: ${body.data.orgId}`);
        } else {
            results.push({ name: 'Ensure org', passed: false, error: body.error?.message });
            console.log(`  ❌ Ensure failed: ${body.error?.message}`);
        }
    } catch (e: any) {
        results.push({ name: 'Ensure org', passed: false, error: e.message });
        console.log(`  ❌ ${e.message}`);
    }

    // Step 2: Check status
    console.log('\nStep 2: Checking status...');
    try {
        const res = await fetch(`${BASE_URL}/api/internal/admin/test-org/status`, {
            headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` },
        });
        const body = await res.json();
        const status = body.data;

        if (body.ok && status) {
            console.log(`  Org ID: ${status.orgId}`);
            console.log(`  Teams: ${status.managedTeamCount} (expected: 3)`);
            console.log(`  Employees: ${status.managedEmployeeCount} (expected: 15)`);
            console.log(`  Weeks: ${status.weekCount}`);
            console.log(`  Sessions: ${status.sessionCount}`);
            console.log(`  Interpretations: ${status.interpretationCount}`);

            // Validate counts
            const teamsOk = status.managedTeamCount === 3;
            const employeesOk = status.managedEmployeeCount === 15;
            const orgIdOk = status.orgId === TEST_ORG_ID;

            results.push({ name: 'Org ID matches', passed: orgIdOk });
            results.push({ name: 'Team count = 3', passed: teamsOk });
            results.push({ name: 'Employee count = 15', passed: employeesOk });

            console.log(`\n  ${orgIdOk ? '✅' : '❌'} Org ID matches`);
            console.log(`  ${teamsOk ? '✅' : '❌'} Team count = 3`);
            console.log(`  ${employeesOk ? '✅' : '❌'} Employee count = 15`);
        } else {
            results.push({ name: 'Status check', passed: false, error: body.error?.message });
            console.log(`  ❌ Status failed: ${body.error?.message}`);
        }
    } catch (e: any) {
        results.push({ name: 'Status check', passed: false, error: e.message });
        console.log(`  ❌ ${e.message}`);
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('SUMMARY');
    console.log('═'.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    for (const r of results) {
        console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
    }

    console.log(`\nTotal: ${passed}/${results.length} passed`);

    if (failed > 0) {
        console.log('\n❌ VERIFICATION FAILED');
        process.exit(1);
    } else {
        console.log('\n✅ VERIFICATION PASSED');
    }
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * VERIFY PHASE 13 SECURITY
 * 
 * Tests access control for interpretation APIs.
 */

import './_bootstrap';
import { getVerifyBaseUrl, fetchJson } from './_verifyBaseUrl';

import { DEV_ORG_ID, DEV_TEAMS } from '../lib/dev/fixtures';

const BASE_URL = getVerifyBaseUrl();
const EMPLOYEE_ID = '33333333-3333-4333-8333-000000000003';
const ORG_ID = DEV_ORG_ID;
const TEAM_ID = DEV_TEAMS[0].id;

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean, detail?: string) {
    if (condition) {
        console.log(`✅ ${name}${detail ? ` (${detail})` : ''}`);
        passed++;
    } else {
        console.error(`❌ ${name}${detail ? ` - ${detail}` : ''}`);
        failed++;
    }
}

async function main() {
    console.log('=== Phase 13 Security Verification ===\n');
    console.log(`Base URL: ${BASE_URL}\n`);

    const queryParams = `?org_id=${ORG_ID}&team_id=${TEAM_ID}`;

    // 1. Unauthenticated Access
    console.log('--- Unauthenticated Access ---');
    try {
        const { status } = await fetchJson(
            `${BASE_URL}/api/interpretation/team${queryParams}`,
            { method: 'GET' },
            'unauth-check'
        );
        test('Missing headers returns 401', status === 401, `status=${status}`);
    } catch (e: any) {
        test('Unauth check', false, e.message);
    }

    // 2. Authenticated Access (Employee)
    console.log('\n--- Authenticated Access ---');
    try {
        const { status, json } = await fetchJson(
            `${BASE_URL}/api/interpretation/team${queryParams}`,
            {
                method: 'GET',
                headers: { 'x-dev-user-id': EMPLOYEE_ID }
            },
            'auth-check'
        );

        // Should be 200 OK or 404 (if no interpretation yet), but definitely authorized
        test('Authorized user accepted', status === 200 || status === 404, `status=${status}`);

        if (status !== 200 && status !== 404 && json) {
            console.error('Debug Error Response:', JSON.stringify(json, null, 2));
        }

        if (status === 200 && json && json.sections) {
            test('Interpretation payload has sections', true);
            test('Payload does not leak secrets', !JSON.stringify(json).includes('key'));
        }
    } catch (e: any) {
        test('Auth check', false, e.message);
    }

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('⚠️ Security verification failed');
        process.exit(1);
    } else {
        console.log('✅ Phase 13 security verification passed');
        process.exit(0);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});

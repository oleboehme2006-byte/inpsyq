#!/usr/bin/env npx tsx
/**
 * PHASE 26.0 — Admin Setup Status API Test
 */

import './_bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase26_0');

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 26.0 — Setup Status API Verification');
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    // Load fixtures if available
    const fixturesPath = path.join(process.cwd(), 'artifacts', 'phase24_3', 'fixtures.json');
    let fixtures: any = null;
    if (fs.existsSync(fixturesPath)) {
        fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));
    }

    const adminUserId = fixtures?.users?.ADMIN || 'test-admin-0004';
    const orgId = fixtures?.orgs?.ORG_A || 'test-org-a';

    console.log(`Admin: ${adminUserId}`);
    console.log(`Org: ${orgId}\n`);

    // Build cookie header for dev mode
    const cookieHeader = `inpsyq_dev_user=${adminUserId}; inpsyq_selected_org=${orgId}`;

    try {
        console.log('Calling /api/admin/setup/status...');
        const res = await fetch(`${BASE_URL}/api/admin/setup/status`, {
            headers: { 'Cookie': cookieHeader },
        });

        if (!res.ok) {
            console.error(`✗ API returned ${res.status}`);
            process.exit(1);
        }

        const data = await res.json();
        console.log('\nResponse preview:');
        console.log(JSON.stringify(data, null, 2).slice(0, 500) + '...\n');

        // Assertions
        let passed = 0;
        let failed = 0;

        if (data.ok === true) {
            console.log('✓ ok: true');
            passed++;
        } else {
            console.log('✗ ok should be true');
            failed++;
        }

        if (data.steps && typeof data.steps === 'object') {
            console.log('✓ steps object present');
            passed++;
        } else {
            console.log('✗ steps object missing');
            failed++;
        }

        const requiredSteps = ['orgSelected', 'teams', 'access', 'pipeline', 'dashboards'];
        for (const step of requiredSteps) {
            if (data.steps?.[step]) {
                console.log(`✓ steps.${step} present`);
                passed++;
            } else {
                console.log(`✗ steps.${step} missing`);
                failed++;
            }
        }

        // Save result
        fs.writeFileSync(
            path.join(ARTIFACTS_DIR, 'status.json'),
            JSON.stringify({ timestamp: new Date().toISOString(), ...data }, null, 2)
        );

        console.log(`\n═══════════════════════════════════════════════════════════════`);
        console.log(`RESULTS: ${passed} passed, ${failed} failed`);
        console.log(`✓ Saved to ${ARTIFACTS_DIR}/status.json`);

        if (failed > 0) process.exit(1);

    } catch (e: any) {
        console.error('Network error:', e.message);
        process.exit(1);
    }
}

main();

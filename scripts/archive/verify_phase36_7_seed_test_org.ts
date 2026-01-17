#!/usr/bin/env npx tsx
/**
 * PHASE 36.7 — Seed Test Org Verification
 * 
 * Calls ensure, seed, and status APIs to verify test org setup.
 * 
 * Usage:
 *   BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=... npx tsx scripts/verify_phase36_7_seed_test_org.ts
 */

import './_bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase36_7');

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 36.7 — Seed Test Org Verification');
    console.log(`  Target: ${BASE_URL}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!ADMIN_SECRET) {
        console.error('⛔ INTERNAL_ADMIN_SECRET required');
        process.exit(1);
    }

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    const results: any = { timestamp: new Date().toISOString() };

    try {
        // Step 1: Ensure
        console.log('Step 1: Calling /test-org/ensure...');
        const ensureRes = await fetch(`${BASE_URL}/api/internal/admin/test-org/ensure`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ADMIN_SECRET}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });
        const ensureData = await ensureRes.json();
        results.ensure = ensureData;

        if (!ensureData.ok) {
            throw new Error(`Ensure failed: ${ensureData.error}`);
        }
        console.log(`  ✓ Org: ${ensureData.orgId}`);
        console.log(`  ✓ User: ${ensureData.userId}`);
        console.log(`  ✓ Teams: ${ensureData.teamIds?.length || 0}`);

        // Step 2: Seed
        console.log('\nStep 2: Calling /test-org/seed...');
        const seedRes = await fetch(`${BASE_URL}/api/internal/admin/test-org/seed`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ADMIN_SECRET}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ weeks: 6, seed: 42 }),
        });
        const seedData = await seedRes.json();
        results.seed = seedData;

        if (!seedData.ok) {
            throw new Error(`Seed failed: ${seedData.error}`);
        }
        console.log(`  ✓ Sessions: ${seedData.sessionsCreated}`);
        console.log(`  ✓ Responses: ${seedData.responsesCreated}`);
        console.log(`  ✓ Interpretations: ${seedData.interpretationsCreated}`);

        // Step 3: Status
        console.log('\nStep 3: Calling /test-org/status...');
        const statusRes = await fetch(`${BASE_URL}/api/internal/admin/test-org/status`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` },
        });
        const statusData = await statusRes.json();
        results.status = statusData;

        if (!statusData.ok || !statusData.exists) {
            throw new Error('Status check failed: org does not exist');
        }
        console.log(`  ✓ Teams: ${statusData.teamCount}`);
        console.log(`  ✓ Employees: ${statusData.employeeCount}`);
        console.log(`  ✓ Weeks: ${statusData.weekCount}`);
        console.log(`  ✓ Sessions: ${statusData.sessionCount}`);
        console.log(`  ✓ Interpretations: ${statusData.interpretationCount}`);

        // Verify minimums
        if (statusData.teamCount < 3) throw new Error('Need at least 3 teams');
        if (statusData.weekCount < 6) throw new Error('Need at least 6 weeks of data');
        if (statusData.sessionCount < 30) throw new Error('Need at least 30 sessions');

        results.passed = true;
        console.log('\n✓ SEED TEST ORG PASSED');

    } catch (e: any) {
        results.passed = false;
        results.error = e.message;
        console.error('\n⛔ FAILED:', e.message);
        process.exit(1);
    } finally {
        fs.writeFileSync(
            path.join(ARTIFACTS_DIR, 'seed_test_org.json'),
            JSON.stringify(results, null, 2)
        );
    }
}

main().catch(e => { console.error(e); process.exit(1); });

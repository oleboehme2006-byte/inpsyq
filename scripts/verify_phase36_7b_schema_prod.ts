#!/usr/bin/env npx tsx
/**
 * PHASE 36.7d — Deterministic Test Org Verification
 * 
 * 1. Fetches schema for key tables
 * 2. Calls ensure/seed/status endpoints
 * 3. Verifies MANAGED counts (not total) are canonical
 * 
 * Response Contract:
 * - All endpoints return { ok: true, data: {...} } on success
 * - All endpoints return { ok: false, error: { code, message } } on failure
 * 
 * Canonical Expectations:
 * - orgId === TEST_ORG_ID (99999999-9999-4999-8999-999999999999)
 * - managedTeamCount === 3
 * - managedEmployeeCount === 15
 * - weekCount >= 6
 * - interpretationCount > 0
 */

import './_bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase36_7d');

// Must match lib/admin/seedTestOrg.ts
const TEST_ORG_ID = '99999999-9999-4999-8999-999999999999';
const FIXTURE_ORG_IDS = [
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
];

interface TestResult {
    test: string;
    passed: boolean;
    details?: any;
    error?: string;
}

interface RawResponse {
    endpoint: string;
    status: number;
    body: any;
}

async function fetchSchema(table: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/internal/diag/db-schema?table=${table}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` },
    });
    return res.json();
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 36.7d — Deterministic Test Org Verification');
    console.log(`  Target: ${BASE_URL}`);
    console.log(`  Expected TEST_ORG_ID: ${TEST_ORG_ID}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!ADMIN_SECRET) {
        console.error('⛔ INTERNAL_ADMIN_SECRET not set');
        process.exit(1);
    }

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    const results: TestResult[] = [];
    const schemas: Record<string, any> = {};
    const rawResponses: RawResponse[] = [];

    // ─────────────────────────────────────────────────────────────────
    // Step 1: Fetch schema for key tables
    // ─────────────────────────────────────────────────────────────────
    console.log('=== Step 1: Fetching Schema ===\n');

    const tables = ['orgs', 'teams', 'users', 'memberships', 'measurement_sessions', 'weekly_interpretations'];

    for (const table of tables) {
        console.log(`  Fetching ${table}...`);
        try {
            const schema = await fetchSchema(table);
            schemas[table] = schema;

            if (schema.ok) {
                const pkCols = schema.primaryKey?.join(', ') || 'none';
                const fkCount = schema.foreignKeys?.length || 0;
                console.log(`    ✓ ${table}: PK=[${pkCols}], FKs=${fkCount}, Cols=${schema.columns?.length}`);
                results.push({ test: `Schema: ${table}`, passed: true, details: { pk: schema.primaryKey, cols: schema.columns?.length } });
            } else {
                console.log(`    ⚠ ${table}: ${schema.error || 'not found'}`);
                results.push({ test: `Schema: ${table}`, passed: false, error: schema.error });
            }
        } catch (e: any) {
            console.log(`    ✗ ${table}: ${e.message}`);
            results.push({ test: `Schema: ${table}`, passed: false, error: e.message });
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Step 2: Call ensure endpoint
    // ─────────────────────────────────────────────────────────────────
    console.log('\n=== Step 2: Ensure Test Org ===\n');

    let ensureOk = false;
    let orgId: string | undefined;
    let teamIds: string[] = [];

    try {
        const res = await fetch(`${BASE_URL}/api/internal/admin/test-org/ensure`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ADMIN_SECRET}`,
                'Content-Type': 'application/json',
            },
        });

        const body = await res.json();
        rawResponses.push({ endpoint: 'ensure', status: res.status, body });

        ensureOk = body.ok === true && body.data?.orgId;
        orgId = body.data?.orgId;
        teamIds = body.data?.teamIds || [];

        // Invariant: orgId must be TEST_ORG_ID
        if (orgId && orgId !== TEST_ORG_ID) {
            console.log(`  ✗ INVARIANT FAIL: orgId=${orgId} but expected ${TEST_ORG_ID}`);
            ensureOk = false;
        }

        // Invariant: orgId must not be a fixture ID
        if (orgId && FIXTURE_ORG_IDS.includes(orgId)) {
            console.log(`  ✗ INVARIANT FAIL: orgId=${orgId} is a FIXTURE ID (collision!)`);
            ensureOk = false;
        }

        // Invariant: must have data.orgId
        if (body.ok && !body.data?.orgId) {
            console.log(`  ✗ INVARIANT FAIL: ok=true but data.orgId is undefined`);
            console.log(`    Raw response: ${JSON.stringify(body)}`);
            ensureOk = false;
        }

        // Invariant: teamIds must be array of 3
        if (body.ok && (!Array.isArray(body.data?.teamIds) || body.data.teamIds.length !== 3)) {
            console.log(`  ✗ INVARIANT FAIL: ok=true but teamIds is not array of 3`);
            console.log(`    Got: ${JSON.stringify(body.data?.teamIds)}`);
            ensureOk = false;
        }

        results.push({
            test: 'Ensure endpoint',
            passed: ensureOk,
            details: { status: res.status, orgId, teamCount: teamIds.length, pruneReport: body.data?.pruneReport },
            error: body.error?.message,
        });

        if (ensureOk) {
            console.log(`  ✓ Ensure succeeded: orgId=${orgId}, teams=${teamIds.length}`);
            if (body.data?.pruneReport) {
                const pr = body.data.pruneReport;
                console.log(`    Prune: removed ${pr.removedTeams} teams, ${pr.removedMemberships} memberships`);
            }
        } else {
            console.log(`  ✗ Ensure failed: ${body.error?.message || 'invariant failure'}`);
            console.log(`    Raw: ${JSON.stringify(body)}`);
        }
    } catch (e: any) {
        results.push({ test: 'Ensure endpoint', passed: false, error: e.message });
        console.log(`  ✗ ${e.message}`);
    }

    // ─────────────────────────────────────────────────────────────────
    // Step 3: Call seed endpoint
    // ─────────────────────────────────────────────────────────────────
    console.log('\n=== Step 3: Seed Test Data ===\n');

    let seedOk = false;

    if (ensureOk && orgId) {
        try {
            const res = await fetch(`${BASE_URL}/api/internal/admin/test-org/seed`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ADMIN_SECRET}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ weeks: 6 }),
            });

            const body = await res.json();
            rawResponses.push({ endpoint: 'seed', status: res.status, body });

            seedOk = body.ok === true;

            results.push({
                test: 'Seed endpoint',
                passed: seedOk,
                details: body.data,
                error: body.error?.message,
            });

            if (seedOk) {
                console.log(`  ✓ Seed succeeded: sessions=${body.data?.sessionsCreated}, interps=${body.data?.interpretationsCreated}`);
            } else {
                console.log(`  ✗ Seed failed: ${body.error?.message || JSON.stringify(body)}`);
            }
        } catch (e: any) {
            results.push({ test: 'Seed endpoint', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}`);
        }
    } else {
        console.log('  ⚠ Skipped (ensure failed)');
        results.push({ test: 'Seed endpoint', passed: false, error: 'Skipped due to ensure failure' });
    }

    // ─────────────────────────────────────────────────────────────────
    // Step 4: Call status endpoint and verify MANAGED counts
    // ─────────────────────────────────────────────────────────────────
    console.log('\n=== Step 4: Verify Status (Managed Counts) ===\n');

    try {
        const res = await fetch(`${BASE_URL}/api/internal/admin/test-org/status`, {
            headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` },
        });

        const body = await res.json();
        rawResponses.push({ endpoint: 'status', status: res.status, body });

        const status = body.data;

        if (body.ok && status) {
            console.log('  Status:');
            console.log(`    exists: ${status.exists}`);
            console.log(`    orgId: ${status.orgId}`);
            console.log(`    isCanonicalId: ${status.isCanonicalId}`);
            console.log(`    totalTeamCount: ${status.totalTeamCount}`);
            console.log(`    managedTeamCount: ${status.managedTeamCount}`);
            console.log(`    totalEmployeeCount: ${status.totalEmployeeCount}`);
            console.log(`    managedEmployeeCount: ${status.managedEmployeeCount}`);
            console.log(`    weekCount: ${status.weekCount}`);
            console.log(`    sessionCount: ${status.sessionCount}`);
            console.log(`    interpretationCount: ${status.interpretationCount}`);

            // Invariant: orgId must be TEST_ORG_ID
            const orgIdOk = status.orgId === TEST_ORG_ID;
            results.push({
                test: 'Status: orgId === TEST_ORG_ID',
                passed: orgIdOk,
                details: { expected: TEST_ORG_ID, actual: status.orgId },
            });
            console.log(`\n  ${orgIdOk ? '✓' : '✗'} orgId === TEST_ORG_ID (got ${status.orgId})`);

            // Hard assertions on MANAGED counts
            const managedTeamOk = status.managedTeamCount === 3;
            const managedEmployeeOk = status.managedEmployeeCount === 15;
            const weekOk = status.weekCount >= 6;
            const interpOk = status.interpretationCount > 0;

            results.push({
                test: 'Status: managedTeamCount === 3',
                passed: managedTeamOk,
                details: { expected: 3, actual: status.managedTeamCount },
            });
            results.push({
                test: 'Status: managedEmployeeCount === 15',
                passed: managedEmployeeOk,
                details: { expected: 15, actual: status.managedEmployeeCount },
            });
            results.push({
                test: 'Status: weekCount >= 6',
                passed: weekOk,
                details: { expected: '>=6', actual: status.weekCount },
            });
            results.push({
                test: 'Status: interpretationCount > 0',
                passed: interpOk,
                details: { expected: '>0', actual: status.interpretationCount },
            });

            console.log(`  ${managedTeamOk ? '✓' : '✗'} managedTeamCount === 3 (got ${status.managedTeamCount})`);
            console.log(`  ${managedEmployeeOk ? '✓' : '✗'} managedEmployeeCount === 15 (got ${status.managedEmployeeCount})`);
            console.log(`  ${weekOk ? '✓' : '✗'} weekCount >= 6 (got ${status.weekCount})`);
            console.log(`  ${interpOk ? '✓' : '✗'} interpretationCount > 0 (got ${status.interpretationCount})`);

            // Log totals for awareness (but don't fail on them)
            if (status.totalTeamCount !== status.managedTeamCount) {
                console.log(`\n  ℹ Note: totalTeamCount (${status.totalTeamCount}) differs from managed (${status.managedTeamCount})`);
            }
            if (status.totalEmployeeCount !== status.managedEmployeeCount) {
                console.log(`  ℹ Note: totalEmployeeCount (${status.totalEmployeeCount}) differs from managed (${status.managedEmployeeCount})`);
            }
        } else {
            console.log(`  ✗ Status check failed: ${body.error?.message || 'no data'}`);
            console.log(`    Raw: ${JSON.stringify(body)}`);
            results.push({ test: 'Status endpoint', passed: false, error: body.error?.message });
        }
    } catch (e: any) {
        results.push({ test: 'Status endpoint', passed: false, error: e.message });
        console.log(`  ✗ ${e.message}`);
    }

    // ─────────────────────────────────────────────────────────────────
    // Summary
    // ─────────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    for (const r of results) {
        const detail = r.error ? ` (${r.error})` : '';
        console.log(`  ${r.passed ? '✓' : '✗'} ${r.test}${detail}`);
    }
    console.log(`\nTotal: ${passed}/${results.length} passed`);

    // Save artifacts
    const artifact = {
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        expectedTestOrgId: TEST_ORG_ID,
        passed,
        failed,
        results,
        schemas,
        rawResponses,
    };

    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'verification_results.json'),
        JSON.stringify(artifact, null, 2)
    );

    console.log(`\n✓ Artifacts saved to ${ARTIFACTS_DIR}/verification_results.json`);

    if (failed > 0) {
        console.log('\n⛔ PHASE 36.7d: FAILED');
        process.exit(1);
    } else {
        console.log('\n✓ PHASE 36.7d: PASSED');
    }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

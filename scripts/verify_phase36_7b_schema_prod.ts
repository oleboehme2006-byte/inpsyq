#!/usr/bin/env npx tsx
/**
 * PHASE 36.7c — Schema Verification & Production Seed Test
 * 
 * 1. Fetches schema for key tables from production
 * 2. Calls ensure/seed/status endpoints
 * 3. Verifies expected data counts
 * 
 * Response Contract:
 * - All endpoints return { ok: true, data: {...} } on success
 * - All endpoints return { ok: false, error: { code, message } } on failure
 */

import './_bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase36_7c');

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
    console.log('  PHASE 36.7c — Schema Verification & Production Seed Test');
    console.log(`  Target: ${BASE_URL}`);
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

    // Check critical schema expectations
    console.log('\n  Verifying schema expectations...');

    // Orgs table should have org_id as PK
    const orgsPK = schemas.orgs?.primaryKey || [];
    const orgsHasOrgId = orgsPK.includes('org_id');
    results.push({
        test: 'Orgs PK is org_id',
        passed: orgsHasOrgId,
        details: { actual: orgsPK },
    });
    console.log(orgsHasOrgId ? '    ✓ orgs.org_id is PK' : `    ✗ orgs PK is ${orgsPK.join(', ')}`);

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

        // Contract: { ok: true, data: { orgId, userId, teamIds } }
        ensureOk = body.ok === true && body.data?.orgId;
        orgId = body.data?.orgId;
        teamIds = body.data?.teamIds || [];

        // Invariant checks
        if (body.ok && !body.data?.orgId) {
            console.log(`  ✗ INVARIANT FAIL: ok=true but data.orgId is undefined`);
            console.log(`    Raw response: ${JSON.stringify(body)}`);
            ensureOk = false;
        }

        if (body.ok && !Array.isArray(body.data?.teamIds)) {
            console.log(`  ✗ INVARIANT FAIL: ok=true but data.teamIds is not an array`);
            console.log(`    Raw response: ${JSON.stringify(body)}`);
            ensureOk = false;
        }

        results.push({
            test: 'Ensure endpoint',
            passed: ensureOk,
            details: { status: res.status, orgId, teamCount: teamIds.length },
            error: body.error?.message,
        });

        if (ensureOk) {
            console.log(`  ✓ Ensure succeeded: orgId=${orgId}, teams=${teamIds.length}`);
        } else {
            console.log(`  ✗ Ensure failed: ${body.error?.message || 'missing data.orgId'}`);
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

            // Contract: { ok: true, data: { orgId, weeksSeeded, sessionsCreated, ... } }
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
    // Step 4: Call status endpoint and verify counts
    // ─────────────────────────────────────────────────────────────────
    console.log('\n=== Step 4: Verify Status ===\n');

    try {
        const res = await fetch(`${BASE_URL}/api/internal/admin/test-org/status`, {
            headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` },
        });

        const body = await res.json();
        rawResponses.push({ endpoint: 'status', status: res.status, body });

        // Contract: { ok: true, data: { exists, orgId, teamCount, ... } }
        const status = body.data;

        if (body.ok && status) {
            console.log('  Status:');
            console.log(`    exists: ${status.exists}`);
            console.log(`    orgId: ${status.orgId}`);
            console.log(`    teamCount: ${status.teamCount}`);
            console.log(`    employeeCount: ${status.employeeCount}`);
            console.log(`    weekCount: ${status.weekCount}`);
            console.log(`    sessionCount: ${status.sessionCount}`);
            console.log(`    interpretationCount: ${status.interpretationCount}`);

            // Hard assertions
            const teamOk = status.teamCount === 3;
            const employeeOk = status.employeeCount === 15;
            const weekOk = status.weekCount >= 6;
            const interpOk = status.interpretationCount > 0;

            results.push({
                test: 'Status: teamCount=3',
                passed: teamOk,
                details: { expected: 3, actual: status.teamCount },
            });
            results.push({
                test: 'Status: employeeCount=15',
                passed: employeeOk,
                details: { expected: 15, actual: status.employeeCount },
            });
            results.push({
                test: 'Status: weekCount>=6',
                passed: weekOk,
                details: { expected: '>=6', actual: status.weekCount },
            });
            results.push({
                test: 'Status: interpretationCount>0',
                passed: interpOk,
                details: { expected: '>0', actual: status.interpretationCount },
            });

            console.log(`\n  ${teamOk ? '✓' : '✗'} teamCount=3 (got ${status.teamCount})`);
            console.log(`  ${employeeOk ? '✓' : '✗'} employeeCount=15 (got ${status.employeeCount})`);
            console.log(`  ${weekOk ? '✓' : '✗'} weekCount>=6 (got ${status.weekCount})`);
            console.log(`  ${interpOk ? '✓' : '✗'} interpretationCount>0 (got ${status.interpretationCount})`);
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
        console.log('\n⛔ PHASE 36.7c: FAILED');
        process.exit(1);
    } else {
        console.log('\n✓ PHASE 36.7c: PASSED');
    }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

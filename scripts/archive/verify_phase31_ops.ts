#!/usr/bin/env npx tsx
/**
 * PHASE 31 — Ops & Health Verification Script
 * 
 * Verifies system health endpoint and operational readiness.
 */

import './_bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.PROD_URL || 'http://localhost:3000';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase31');

interface TestResult {
    test: string;
    passed: boolean;
    details?: any;
    error?: string;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 31 — Ops & Health Verification');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!ADMIN_SECRET) {
        console.error('⛔ INTERNAL_ADMIN_SECRET not set');
        process.exit(1);
    }

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    const results: TestResult[] = [];

    // ─────────────────────────────────────────────────────────────────
    // Test 1: System health endpoint
    // ─────────────────────────────────────────────────────────────────
    console.log('Test 1: System health endpoint...');
    try {
        const res = await fetch(`${BASE_URL}/api/internal/health/system`, {
            headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` },
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        // Check required fields
        const hasDb = data.health?.database !== undefined;
        const hasPipeline = data.health?.pipeline !== undefined;
        const hasInterpretations = data.health?.interpretations !== undefined;
        const hasLocks = data.health?.locks !== undefined;

        const allFields = hasDb && hasPipeline && hasInterpretations && hasLocks;

        results.push({
            test: 'System health endpoint',
            passed: allFields,
            details: {
                database: data.health?.database?.ok,
                pipeline: data.health?.pipeline?.ok,
                interpretations: data.health?.interpretations?.ok,
                locks: data.health?.locks?.ok,
            },
        });

        console.log(allFields ? '  ✓ All health fields present' : '  ✗ Missing fields');

        // Test 2: DB connectivity
        console.log('Test 2: DB connectivity...');
        results.push({
            test: 'DB connectivity',
            passed: data.health?.database?.ok === true,
            details: { latency: data.health?.database?.latency_ms },
        });
        console.log(data.health?.database?.ok ? '  ✓ DB connected' : '  ✗ DB failed');

        // Test 3: No stuck locks
        console.log('Test 3: No stuck locks...');
        results.push({
            test: 'No stuck locks',
            passed: data.health?.locks?.ok === true,
            details: { stuckCount: data.health?.locks?.stuckCount },
        });
        console.log(data.health?.locks?.ok ? '  ✓ No stuck locks' : '  ⚠ Stuck locks detected');

    } catch (e: any) {
        results.push({
            test: 'System health endpoint',
            passed: false,
            error: e.message,
        });
        console.log(`  ✗ ${e.message}`);
    }

    // ─────────────────────────────────────────────────────────────────
    // Test 4: Unauthorized access blocked
    // ─────────────────────────────────────────────────────────────────
    console.log('Test 4: Unauthorized access blocked...');
    try {
        const res = await fetch(`${BASE_URL}/api/internal/health/system`);
        const blocked = res.status === 401;

        results.push({
            test: 'Unauthorized access blocked',
            passed: blocked,
            details: { status: res.status },
        });
        console.log(blocked ? '  ✓ Correctly blocked' : '  ✗ Access allowed without auth');
    } catch (e: any) {
        results.push({
            test: 'Unauthorized access blocked',
            passed: false,
            error: e.message,
        });
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    for (const r of results) {
        console.log(`  ${r.passed ? '✓' : '✗'} ${r.test}`);
    }
    console.log(`\nTotal: ${passed}/${results.length} passed`);

    // Save
    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'ops.json'),
        JSON.stringify({
            timestamp: new Date().toISOString(),
            passed,
            failed,
            results,
        }, null, 2)
    );

    console.log(`\n✓ Artifacts saved to ${ARTIFACTS_DIR}/ops.json`);

    if (failed > 0) {
        console.log('\n⛔ PHASE 31 OPS: FAILED');
        process.exit(1);
    } else {
        console.log('\n✓ PHASE 31 OPS: PASSED');
    }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

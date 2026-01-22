#!/usr/bin/env npx tsx
/**
 * UNIFIED VERIFICATION RUNNER
 * 
 * Runs all verification checks and produces a single report.
 * 
 * Usage:
 *   npx tsx scripts/verification/run.ts                    # Local only
 *   BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=xxx npx tsx scripts/verification/run.ts  # With prod
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL;
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const ARTIFACT_DIR = path.join(process.cwd(), 'artifacts', 'verification', TIMESTAMP);

interface TestResult {
    name: string;
    passed: boolean;
    output?: string;
    error?: string;
}

interface VerificationReport {
    timestamp: string;
    baseUrl: string | null;
    hasAdminSecret: boolean;
    results: TestResult[];
    allPassed: boolean;
}

function runCommand(cmd: string, name: string): TestResult {
    try {
        const output = execSync(cmd, {
            cwd: process.cwd(),
            encoding: 'utf8',
            timeout: 120000,
            env: { ...process.env, FORCE_COLOR: '0' }
        });
        return { name, passed: true, output: output.slice(-2000) };
    } catch (e: any) {
        return { name, passed: false, error: e.message, output: e.stdout?.slice(-2000) };
    }
}

async function runProdApi(endpoint: string, method: string, body?: object): Promise<any> {
    const url = `${BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${ADMIN_SECRET}`,
        'Content-Type': 'application/json',
    };

    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    return { status: res.status, body: await res.json().catch(() => null) };
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log(' INPSYQ VERIFICATION RUNNER');
    console.log('═══════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

    const results: TestResult[] = [];

    // ─────────────────────────────────────────────────────────────────
    // LOCAL CHECKS
    // ─────────────────────────────────────────────────────────────────

    console.log('[LOCAL] Running build...');
    results.push(runCommand('npm run build', 'build'));

    console.log('[LOCAL] Running lint...');
    results.push(runCommand('npm run lint', 'lint'));

    console.log('[LOCAL] Running origin verification...');
    results.push(runCommand('npx tsx scripts/verification/origin.verify.ts', 'origin'));

    console.log('[LOCAL] Running email verification...');
    results.push(runCommand('npx tsx scripts/verification/email.verify.ts', 'email'));

    // ─────────────────────────────────────────────────────────────────
    // PRODUCTION CHECKS (if credentials provided)
    // ─────────────────────────────────────────────────────────────────

    if (BASE_URL && ADMIN_SECRET) {
        console.log(`\n[PROD] Verifying against ${BASE_URL}...\n`);

        // Test org endpoints
        try {
            console.log('[PROD] test-org/status...');
            const status = await runProdApi('/api/internal/admin/test-org/status', 'GET');
            results.push({
                name: 'prod:test-org-status',
                passed: status.status === 200 && status.body?.ok === true,
                output: JSON.stringify(status.body, null, 2),
            });

            console.log('[PROD] test-org/ensure...');
            const ensure = await runProdApi('/api/internal/admin/test-org/ensure', 'POST', {});
            results.push({
                name: 'prod:test-org-ensure',
                passed: ensure.status === 200 && ensure.body?.ok === true,
                output: JSON.stringify(ensure.body, null, 2),
            });

            console.log('[PROD] test-org/seed...');
            const seed = await runProdApi('/api/internal/admin/test-org/seed', 'POST', { weeks: 6, seed: 42 });
            results.push({
                name: 'prod:test-org-seed',
                passed: seed.status === 200 && seed.body?.ok === true,
                output: JSON.stringify(seed.body, null, 2),
            });

            // Verify expected counts
            console.log('[PROD] Verifying counts...');
            const finalStatus = await runProdApi('/api/internal/admin/test-org/status', 'GET');
            const data = finalStatus.body?.data;
            const countsPassed = data?.managedTeamCount === 3 &&
                data?.managedEmployeeCount === 15 &&
                data?.weekCount >= 6 &&
                data?.sessionCount >= 90;
            results.push({
                name: 'prod:test-org-counts',
                passed: countsPassed,
                output: JSON.stringify(data, null, 2),
            });

            // Security check: verify endpoints require auth
            console.log('[PROD] Security check (no-auth should fail)...');
            const noAuthRes = await fetch(`${BASE_URL}/api/internal/admin/test-org/status`);
            results.push({
                name: 'prod:security-no-auth',
                passed: noAuthRes.status === 401,
                output: `Status: ${noAuthRes.status}`,
            });

        } catch (e: any) {
            results.push({ name: 'prod:api-check', passed: false, error: e.message });
        }
    } else {
        console.log('\n[PROD] Skipped (BASE_URL or INTERNAL_ADMIN_SECRET not set)\n');
    }

    // ─────────────────────────────────────────────────────────────────
    // REPORT
    // ─────────────────────────────────────────────────────────────────

    const allPassed = results.every(r => r.passed);

    const report: VerificationReport = {
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL || null,
        hasAdminSecret: !!ADMIN_SECRET,
        results,
        allPassed,
    };

    const reportPath = path.join(ARTIFACT_DIR, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' RESULTS');
    console.log('═══════════════════════════════════════════════════════\n');

    for (const r of results) {
        console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
    }

    console.log(`\n  Report saved to: ${reportPath}`);
    console.log(`\n  ${allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}\n`);

    process.exit(allPassed ? 0 : 1);
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});

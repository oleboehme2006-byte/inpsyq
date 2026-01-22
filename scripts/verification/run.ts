#!/usr/bin/env npx tsx
/**
 * UNIFIED VERIFICATION RUNNER
 * 
 * Runs all verification checks and produces a single report.
 * 
 * Usage:
 *   npx tsx scripts/verification/run.ts                                           # Local build/lint only
 *   BASE_URL=http://localhost:3000 INTERNAL_ADMIN_SECRET=dev-secret npx tsx scripts/verification/run.ts  # Local admin UX
 *   BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=xxx npx tsx scripts/verification/run.ts        # Production
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || '';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET || '';
const IS_LOCALHOST = BASE_URL.includes('localhost');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const ARTIFACT_DIR = path.join(process.cwd(), 'artifacts', 'admin_ux_readiness', TIMESTAMP);

interface TestResult {
    name: string;
    passed: boolean;
    output?: string;
    error?: string;
    status?: number;
}

interface VerificationReport {
    timestamp: string;
    baseUrl: string;
    mode: 'local-only' | 'localhost-admin' | 'production';
    results: TestResult[];
    allPassed: boolean;
}

// Session cookie jar for simulating browser auth
let sessionCookie = '';
let orgCookie = '';

function runCommand(cmd: string, name: string): TestResult {
    try {
        const output = execSync(cmd, {
            cwd: process.cwd(),
            encoding: 'utf8',
            timeout: 180000,
            env: { ...process.env, FORCE_COLOR: '0' }
        });
        return { name, passed: true, output: output.slice(-2000) };
    } catch (e: any) {
        return { name, passed: false, error: e.message, output: e.stdout?.slice(-2000) };
    }
}

async function apiCall(
    endpoint: string,
    method: string = 'GET',
    body?: object,
    useAuth: 'admin' | 'session' | 'none' = 'admin'
): Promise<{ status: number; body: any; cookies?: string[] }> {
    const url = `${BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (useAuth === 'admin') {
        headers['Authorization'] = `Bearer ${ADMIN_SECRET}`;
    }
    if (useAuth === 'session' && (sessionCookie || orgCookie)) {
        headers['Cookie'] = [sessionCookie, orgCookie].filter(Boolean).join('; ');
    }

    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const cookies = res.headers.getSetCookie?.() || [];

    // Extract session cookie if present
    for (const c of cookies) {
        if (c.includes('inpsyq_session=')) {
            sessionCookie = c.split(';')[0];
        }
        if (c.includes('inpsyq_selected_org=')) {
            orgCookie = c.split(';')[0];
        }
    }

    return {
        status: res.status,
        body: await res.json().catch(() => null),
        cookies
    };
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log(' INPSYQ ADMIN UX READINESS VERIFICATION');
    console.log('═══════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

    const results: TestResult[] = [];
    const mode = !BASE_URL ? 'local-only' : IS_LOCALHOST ? 'localhost-admin' : 'production';

    console.log(`Mode: ${mode}`);
    console.log(`Base URL: ${BASE_URL || '(none)'}`);
    console.log(`Admin Secret: ${ADMIN_SECRET ? '(set)' : '(not set)'}\n`);

    // ─────────────────────────────────────────────────────────────────
    // PHASE 1: BUILD & LINT
    // ─────────────────────────────────────────────────────────────────

    console.log('[1] Build & Lint');
    results.push(runCommand('npm run build', 'build'));
    if (!results[results.length - 1].passed) {
        console.log('❌ Build failed, stopping');
        return finishReport(results, mode);
    }

    results.push(runCommand('npm run lint', 'lint'));

    // ─────────────────────────────────────────────────────────────────
    // PHASE 2: ADMIN UX READINESS (if BASE_URL + SECRET set)
    // ─────────────────────────────────────────────────────────────────

    if (BASE_URL && ADMIN_SECRET) {
        console.log('\n[2] Test Org Setup');

        // Ensure test org
        const ensure = await apiCall('/api/internal/admin/test-org/ensure', 'POST', {});
        results.push({
            name: 'test-org:ensure',
            passed: ensure.status === 200 && ensure.body?.ok === true,
            output: JSON.stringify(ensure.body, null, 2).slice(0, 1000),
            status: ensure.status,
        });

        if (!results[results.length - 1].passed) {
            console.log('❌ Test org ensure failed, stopping');
            return finishReport(results, mode);
        }

        const testOrgId = ensure.body?.data?.orgId;
        const adminUserId = ensure.body?.data?.userId;
        console.log(`  Test Org ID: ${testOrgId}`);
        console.log(`  Admin User ID: ${adminUserId}`);

        // Seed test org
        console.log('\n[3] Seed Test Org (6 weeks)');
        const seed = await apiCall('/api/internal/admin/test-org/seed', 'POST', { weeks: 6, seed: 42 });
        results.push({
            name: 'test-org:seed',
            passed: seed.status === 200 && seed.body?.ok === true,
            output: JSON.stringify(seed.body, null, 2).slice(0, 1000),
            status: seed.status,
        });

        // Verify counts
        console.log('\n[4] Verify Test Org Status');
        const status = await apiCall('/api/internal/admin/test-org/status', 'GET');
        const data = status.body?.data;
        const countsPassed = data?.managedTeamCount === 3 &&
            data?.managedEmployeeCount === 15 &&
            data?.weekCount >= 6 &&
            data?.sessionCount >= 90;
        results.push({
            name: 'test-org:counts',
            passed: countsPassed,
            output: JSON.stringify(data, null, 2),
            status: status.status,
        });

        // ─────────────────────────────────────────────────────────────────
        // PHASE 3: SIMULATE AUTH FLOW
        // ─────────────────────────────────────────────────────────────────

        console.log('\n[5] Mint Login Link');
        const mint = await apiCall('/api/internal/admin/mint-login-link', 'POST', {
            email: 'oleboehme2006@gmail.com'
        });
        results.push({
            name: 'auth:mint-link',
            passed: mint.status === 200 && mint.body?.ok === true && !!mint.body?.data?.consumeUrl,
            output: `Status: ${mint.status}, hasUrl: ${!!mint.body?.data?.consumeUrl}`,
            status: mint.status,
        });

        if (!results[results.length - 1].passed) {
            console.log('❌ Mint login link failed');
            return finishReport(results, mode);
        }

        // Extract token and consume it
        const consumeUrl = new URL(mint.body.data.consumeUrl);
        const token = consumeUrl.searchParams.get('token');

        console.log('\n[6] Consume Login Token');
        const consume = await apiCall(`/api/auth/consume?token=${encodeURIComponent(token!)}`, 'POST', undefined, 'none');
        results.push({
            name: 'auth:consume',
            passed: consume.status === 200 && !!sessionCookie,
            output: `Status: ${consume.status}, Session cookie set: ${!!sessionCookie}`,
            status: consume.status,
        });

        // ─────────────────────────────────────────────────────────────────
        // PHASE 4: ORG SELECTION (PRE-ORG-SELECT AUTH)
        // ─────────────────────────────────────────────────────────────────

        console.log('\n[7] Org List (pre-selection)');
        const orgList = await apiCall('/api/org/list', 'GET', undefined, 'session');
        const orgs = orgList.body?.data?.orgs || [];
        const uniqueOrgIds = new Set(orgs.map((o: any) => o.orgId));
        const hasDuplicates = orgs.length !== uniqueOrgIds.size;
        const hasTestOrg = orgs.some((o: any) => o.orgId === testOrgId);

        results.push({
            name: 'org:list-unique',
            passed: orgList.status === 200 && !hasDuplicates && hasTestOrg,
            output: `Count: ${orgs.length}, Unique: ${uniqueOrgIds.size}, HasTestOrg: ${hasTestOrg}`,
            status: orgList.status,
        });

        // Select test org
        console.log('\n[8] Org Select');
        const orgSelect = await apiCall('/api/org/select', 'POST', { orgId: testOrgId }, 'session');
        results.push({
            name: 'org:select',
            passed: orgSelect.status === 200 && orgSelect.body?.ok === true && !!orgCookie,
            output: `Status: ${orgSelect.status}, OrgCookie set: ${!!orgCookie}, redirect: ${orgSelect.body?.redirectTo}`,
            status: orgSelect.status,
        });

        // ─────────────────────────────────────────────────────────────────
        // PHASE 5: ADMIN API ENDPOINTS
        // ─────────────────────────────────────────────────────────────────

        console.log('\n[9] Admin Teams');
        const teams = await apiCall('/api/admin/teams', 'GET', undefined, 'session');
        const teamNames = (teams.body?.teams || []).map((t: any) => t.name);
        const hasAllTeams = ['Alpha', 'Beta', 'Gamma'].every(n => teamNames.includes(n));
        results.push({
            name: 'admin:teams',
            passed: teams.status === 200 && teams.body?.ok === true && hasAllTeams,
            output: `Teams: ${teamNames.join(', ')}, Count: ${teamNames.length}`,
            status: teams.status,
        });

        console.log('\n[10] Admin Org Health');
        const health = await apiCall('/api/admin/org/health', 'GET', undefined, 'session');
        const healthData = health.body?.health;
        const okTeams = healthData?.okTeams || 0;
        const totalTeams = healthData?.totalTeams || 0;
        const coverage = totalTeams > 0 ? (okTeams / totalTeams * 100) : 0;
        results.push({
            name: 'admin:health',
            passed: health.status === 200 && health.body?.ok === true && okTeams === 3,
            output: `OK: ${okTeams}/${totalTeams}, Coverage: ${coverage.toFixed(1)}%, Missing: ${healthData?.missingProducts}`,
            status: health.status,
        });

        console.log('\n[11] Admin System Alerts');
        const alerts = await apiCall('/api/admin/system/alerts', 'GET', undefined, 'session');
        const computedAlerts = alerts.body?.computedAlerts || [];
        const hasCriticalCoverageGap = computedAlerts.some((a: any) =>
            a.alertType === 'COVERAGE_GAP' && a.severity === 'critical'
        );
        results.push({
            name: 'admin:alerts-no-critical-gap',
            passed: alerts.status === 200 && !hasCriticalCoverageGap,
            output: `Computed alerts: ${computedAlerts.length}, CriticalGap: ${hasCriticalCoverageGap}`,
            status: alerts.status,
        });

        console.log('\n[12] Admin Weekly Aggregates');
        const weekly = await apiCall('/api/admin/weekly', 'GET', undefined, 'session');
        const weeklyRows = Array.isArray(weekly.body) ? weekly.body : [];
        results.push({
            name: 'admin:weekly-aggregates',
            passed: weekly.status === 200 && weeklyRows.length >= 18, // 3 teams * 6 weeks
            output: `Rows: ${weeklyRows.length}`,
            status: weekly.status,
        });

        // ─────────────────────────────────────────────────────────────────
        // PHASE 6: SECURITY CHECKS
        // ─────────────────────────────────────────────────────────────────

        console.log('\n[13] Security: Admin endpoints require auth');
        const noAuthTeams = await apiCall('/api/admin/teams', 'GET', undefined, 'none');
        results.push({
            name: 'security:admin-requires-auth',
            passed: noAuthTeams.status === 401 || noAuthTeams.status === 403,
            output: `Status without auth: ${noAuthTeams.status}`,
            status: noAuthTeams.status,
        });

        const noAuthInternal = await fetch(`${BASE_URL}/api/internal/admin/test-org/status`);
        results.push({
            name: 'security:internal-requires-secret',
            passed: noAuthInternal.status === 401,
            output: `Status without secret: ${noAuthInternal.status}`,
            status: noAuthInternal.status,
        });

    } else {
        console.log('\n[ADMIN UX] Skipped (BASE_URL or INTERNAL_ADMIN_SECRET not set)');
    }

    return finishReport(results, mode);
}

async function finishReport(results: TestResult[], mode: string) {
    const allPassed = results.every(r => r.passed);

    const report: VerificationReport = {
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        mode: mode as any,
        results,
        allPassed,
    };

    const reportPath = path.join(ARTIFACT_DIR, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Also write individual response files for key endpoints
    const responsesDir = path.join(ARTIFACT_DIR, 'responses');
    fs.mkdirSync(responsesDir, { recursive: true });
    for (const r of results) {
        if (r.output) {
            const safeName = r.name.replace(/[:/]/g, '_');
            fs.writeFileSync(path.join(responsesDir, `${safeName}.txt`), r.output);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(' RESULTS');
    console.log('═══════════════════════════════════════════════════════\n');

    for (const r of results) {
        console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
    }

    console.log(`\n  Report: ${reportPath}`);
    console.log(`  ${allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}\n`);

    process.exit(allPassed ? 0 : 1);
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});

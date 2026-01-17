#!/usr/bin/env npx tsx
/**
 * PHASE 36.3 — Production Auth Diagnostics Verification
 * 
 * Verifies production environment is correctly configured for auth.
 */

import './_bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase36_3');

interface TestResult {
    test: string;
    passed: boolean;
    expected?: any;
    actual?: any;
    error?: string;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 36.3 — Production Auth Diagnostics');
    console.log(`  Target: ${BASE_URL}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!ADMIN_SECRET) {
        console.error('⛔ INTERNAL_ADMIN_SECRET not set');
        process.exit(1);
    }

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    const results: TestResult[] = [];
    let diagData: any = null;

    // ─────────────────────────────────────────────────────────────────
    // Test 1: Fetch auth-request-link diagnostic
    // ─────────────────────────────────────────────────────────────────
    console.log('Test 1: Fetch auth-request-link diagnostic...');
    try {
        const res = await fetch(`${BASE_URL}/api/internal/diag/auth-request-link`, {
            headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` },
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        diagData = await res.json();
        results.push({
            test: 'Diagnostic endpoint accessible',
            passed: diagData.ok === true,
        });
        console.log('  ✓ Endpoint accessible');
    } catch (e: any) {
        results.push({ test: 'Diagnostic endpoint', passed: false, error: e.message });
        console.log(`  ✗ ${e.message}`);
    }

    if (diagData) {
        // ─────────────────────────────────────────────────────────────────
        // Test 2: VERCEL_ENV is production
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 2: VERCEL_ENV is production...');
        const vercelEnv = diagData.environment?.vercel_env;
        const isProdEnv = vercelEnv === 'production';

        results.push({
            test: 'VERCEL_ENV=production',
            passed: isProdEnv,
            expected: 'production',
            actual: vercelEnv,
        });
        console.log(isProdEnv ? '  ✓ VERCEL_ENV=production' : `  ✗ VERCEL_ENV=${vercelEnv}`);

        // ─────────────────────────────────────────────────────────────────
        // Test 3: Computed origin is production canonical
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 3: Computed origin is canonical...');
        const computedOrigin = diagData.origin?.computed;
        const isCanonical = computedOrigin === 'https://www.inpsyq.com';

        results.push({
            test: 'Origin is canonical',
            passed: isCanonical,
            expected: 'https://www.inpsyq.com',
            actual: computedOrigin,
        });
        console.log(isCanonical ? '  ✓ Origin is canonical' : `  ✗ Origin is ${computedOrigin}`);

        // ─────────────────────────────────────────────────────────────────
        // Test 4: Origin source is AUTH_BASE_URL
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 4: Origin source is AUTH_BASE_URL...');
        const originSource = diagData.origin?.source;
        const isAuthBaseUrl = originSource === 'AUTH_BASE_URL';

        results.push({
            test: 'Origin source is AUTH_BASE_URL',
            passed: isAuthBaseUrl,
            expected: 'AUTH_BASE_URL',
            actual: originSource,
        });
        console.log(isAuthBaseUrl ? '  ✓ Source is AUTH_BASE_URL' : `  ✗ Source is ${originSource}`);

        // ─────────────────────────────────────────────────────────────────
        // Test 5: Origin is valid
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 5: Origin is valid (no errors)...');
        const originValid = diagData.origin?.valid;
        const originError = diagData.origin?.error;

        results.push({
            test: 'Origin valid',
            passed: originValid === true && !originError,
            error: originError,
        });
        console.log(originValid && !originError ? '  ✓ Origin valid' : `  ✗ Origin invalid: ${originError}`);

        // ─────────────────────────────────────────────────────────────────
        // Test 6: EMAIL_PROVIDER effective is resend
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 6: EMAIL_PROVIDER effective is resend...');
        const emailProvider = diagData.email?.provider_effective;
        const isResend = emailProvider === 'resend';

        results.push({
            test: 'EMAIL_PROVIDER=resend',
            passed: isResend,
            expected: 'resend',
            actual: emailProvider,
        });
        console.log(isResend ? '  ✓ EMAIL_PROVIDER=resend' : `  ✗ EMAIL_PROVIDER=${emailProvider}`);

        // ─────────────────────────────────────────────────────────────────
        // Test 7: Email NOT suppressed in production
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 7: Email not suppressed...');
        const suppressed = diagData.email?.suppressed;

        results.push({
            test: 'Email not suppressed',
            passed: suppressed === false,
            expected: false,
            actual: suppressed,
        });
        console.log(!suppressed ? '  ✓ Email not suppressed' : `  ✗ Email suppressed: ${diagData.email?.suppressed_reason}`);
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    for (const r of results) {
        const detail = r.error ? ` (${r.error})` : (r.actual !== undefined && !r.passed ? ` (got: ${r.actual})` : '');
        console.log(`  ${r.passed ? '✓' : '✗'} ${r.test}${detail}`);
    }
    console.log(`\nTotal: ${passed}/${results.length} passed`);

    // Save artifact
    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'prod_diag.json'),
        JSON.stringify({
            timestamp: new Date().toISOString(),
            baseUrl: BASE_URL,
            passed,
            failed,
            results,
            rawDiag: diagData,
        }, null, 2)
    );

    console.log(`\n✓ Artifacts saved to ${ARTIFACTS_DIR}/prod_diag.json`);

    if (failed > 0) {
        console.log('\n⛔ PHASE 36.3 PROD DIAG: FAILED');
        process.exit(1);
    } else {
        console.log('\n✓ PHASE 36.3 PROD DIAG: PASSED');
    }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

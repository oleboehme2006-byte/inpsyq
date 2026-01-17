#!/usr/bin/env npx tsx
/**
 * PHASE 36.2 — Production Auth Origin Verification
 * 
 * Validates that production is configured with correct auth origin.
 */

import './_bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase36_2');

interface TestResult {
    test: string;
    passed: boolean;
    expected?: any;
    actual?: any;
    error?: string;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 36.2 — Production Auth Origin Verification');
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
    // Test 1: Fetch auth-origin diagnostic
    // ─────────────────────────────────────────────────────────────────
    console.log('Test 1: Fetch auth-origin diagnostic...');
    try {
        const res = await fetch(`${BASE_URL}/api/internal/diag/auth-origin`, {
            headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` },
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        diagData = await res.json();
        results.push({
            test: 'Auth origin endpoint accessible',
            passed: diagData.ok === true,
        });
        console.log('  ✓ Endpoint accessible');
    } catch (e: any) {
        results.push({ test: 'Auth origin endpoint', passed: false, error: e.message });
        console.log(`  ✗ ${e.message}`);
    }

    if (diagData) {
        // ─────────────────────────────────────────────────────────────────
        // Test 2: Computed origin is production canonical
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 2: Computed origin is production canonical...');
        const computedOrigin = diagData.auth?.computed_origin;
        const isCanonical = computedOrigin === 'https://www.inpsyq.com';

        results.push({
            test: 'Origin is canonical',
            passed: isCanonical,
            expected: 'https://www.inpsyq.com',
            actual: computedOrigin,
        });
        console.log(isCanonical ? '  ✓ Origin is canonical' : `  ✗ Origin is ${computedOrigin}`);

        // ─────────────────────────────────────────────────────────────────
        // Test 3: VERCEL_ENV is production
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 3: VERCEL_ENV is production...');
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
        // Test 4: EMAIL_PROVIDER is resend
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 4: EMAIL_PROVIDER effective is resend...');
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
        // Test 5: Preview email disabled is false in production
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 5: Preview email disabled is false...');
        const previewDisabled = diagData.email?.preview_email_disabled;
        const notDisabled = previewDisabled === false;

        results.push({
            test: 'Preview email disabled (false in prod)',
            passed: notDisabled,
            expected: false,
            actual: previewDisabled,
        });
        console.log(notDisabled ? '  ✓ Preview not disabled' : '  ✗ Preview is disabled');

        // ─────────────────────────────────────────────────────────────────
        // Test 6: Origin is valid
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 6: Origin is valid...');
        const originValid = diagData.auth?.origin_valid;

        results.push({
            test: 'Origin valid',
            passed: originValid === true,
        });
        console.log(originValid ? '  ✓ Origin valid' : '  ✗ Origin invalid');
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
        path.join(ARTIFACTS_DIR, 'prod_auth_origin.json'),
        JSON.stringify({
            timestamp: new Date().toISOString(),
            baseUrl: BASE_URL,
            passed,
            failed,
            results,
            rawDiag: diagData,
        }, null, 2)
    );

    console.log(`\n✓ Artifacts saved to ${ARTIFACTS_DIR}/prod_auth_origin.json`);

    if (failed > 0) {
        console.log('\n⛔ PHASE 36.2 AUTH ORIGIN: FAILED');
        process.exit(1);
    } else {
        console.log('\n✓ PHASE 36.2 AUTH ORIGIN: PASSED');
    }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

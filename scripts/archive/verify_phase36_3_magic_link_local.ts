#!/usr/bin/env npx tsx
/**
 * PHASE 36.3 — Local Magic Link Verification
 * 
 * Tests that magic links are constructed correctly using test transport.
 * 
 * Usage:
 *   EMAIL_PROVIDER=test APP_ENV=production AUTH_BASE_URL=https://www.inpsyq.com \
 *     npx tsx scripts/verify_phase36_3_magic_link_local.ts
 */

import './_bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.LOCAL_BASE_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@inpsyq.com';
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase36_3');
const OUTBOX_FILE = path.join(process.cwd(), 'artifacts', 'email_outbox', 'last_magic_link.json');

interface TestResult {
    test: string;
    passed: boolean;
    expected?: any;
    actual?: any;
    error?: string;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 36.3 — Local Magic Link Verification');
    console.log(`  Server: ${BASE_URL}`);
    console.log(`  APP_ENV: ${process.env.APP_ENV}`);
    console.log(`  AUTH_BASE_URL: ${process.env.AUTH_BASE_URL}`);
    console.log(`  EMAIL_PROVIDER: ${process.env.EMAIL_PROVIDER}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Validate environment
    if (process.env.EMAIL_PROVIDER !== 'test') {
        console.error('⛔ EMAIL_PROVIDER must be "test" for this verification');
        console.error('   Run with: EMAIL_PROVIDER=test npx tsx ...');
        process.exit(1);
    }

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    const results: TestResult[] = [];

    // Clean previous outbox
    try {
        if (fs.existsSync(OUTBOX_FILE)) {
            fs.unlinkSync(OUTBOX_FILE);
        }
    } catch { }

    // ─────────────────────────────────────────────────────────────────
    // Step 1: Request magic link via API
    // ─────────────────────────────────────────────────────────────────
    console.log('Step 1: Request magic link...');
    let requestOk = false;
    try {
        const res = await fetch(`${BASE_URL}/api/auth/request-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL }),
        });

        const data = await res.json();
        requestOk = res.ok && data.ok === true;

        results.push({
            test: 'Request link returns ok',
            passed: requestOk,
            actual: data,
        });
        console.log(requestOk ? '  ✓ Request succeeded' : `  ✗ Request failed: ${JSON.stringify(data)}`);
    } catch (e: any) {
        results.push({ test: 'Request link', passed: false, error: e.message });
        console.log(`  ✗ ${e.message}`);
    }

    // Wait for file to be written
    await new Promise(r => setTimeout(r, 500));

    // ─────────────────────────────────────────────────────────────────
    // Step 2: Read outbox file
    // ─────────────────────────────────────────────────────────────────
    console.log('Step 2: Read email outbox...');
    let outboxData: any = null;
    try {
        if (!fs.existsSync(OUTBOX_FILE)) {
            throw new Error('Outbox file not created');
        }
        outboxData = JSON.parse(fs.readFileSync(OUTBOX_FILE, 'utf-8'));
        results.push({
            test: 'Outbox file exists',
            passed: true,
        });
        console.log('  ✓ Outbox file found');
    } catch (e: any) {
        results.push({ test: 'Outbox file', passed: false, error: e.message });
        console.log(`  ✗ ${e.message}`);
    }

    if (outboxData) {
        // ─────────────────────────────────────────────────────────────────
        // Step 3: Validate link components
        // ─────────────────────────────────────────────────────────────────
        const url = outboxData.urlComponents;

        console.log('Step 3: Validate extracted link...');
        console.log(`  Link: ${outboxData.extractedLink}`);

        // Test: Protocol is HTTPS (in production mode)
        const expectedProtocol = process.env.APP_ENV === 'production' ? 'https:' : 'http:';
        const protocolOk = url?.protocol === expectedProtocol;
        results.push({
            test: 'Protocol correct',
            passed: protocolOk,
            expected: expectedProtocol,
            actual: url?.protocol,
        });
        console.log(protocolOk ? `  ✓ Protocol: ${url?.protocol}` : `  ✗ Protocol: ${url?.protocol} (expected ${expectedProtocol})`);

        // Test: Host is correct
        const expectedHost = process.env.APP_ENV === 'production' ? 'www.inpsyq.com' : undefined;
        const hostOk = expectedHost ? url?.host === expectedHost : true;
        results.push({
            test: 'Host correct',
            passed: hostOk,
            expected: expectedHost,
            actual: url?.host,
        });
        console.log(hostOk ? `  ✓ Host: ${url?.host}` : `  ✗ Host: ${url?.host} (expected ${expectedHost})`);

        // Test: Path is /api/auth/consume
        const pathOk = url?.pathname === '/api/auth/consume';
        results.push({
            test: 'Path is /api/auth/consume',
            passed: pathOk,
            expected: '/api/auth/consume',
            actual: url?.pathname,
        });
        console.log(pathOk ? '  ✓ Path: /api/auth/consume' : `  ✗ Path: ${url?.pathname}`);

        // Test: Token exists and is long enough
        const tokenLength = url?.tokenLength || 0;
        const tokenOk = tokenLength >= 20;
        results.push({
            test: 'Token exists (length >= 20)',
            passed: tokenOk,
            expected: '>= 20',
            actual: tokenLength,
        });
        console.log(tokenOk ? `  ✓ Token length: ${tokenLength}` : `  ✗ Token length: ${tokenLength} (expected >= 20)`);

        // Test: No preview domain
        const hasPreviewDomain = url?.host?.includes('vercel.app') || false;
        results.push({
            test: 'No preview domain',
            passed: !hasPreviewDomain,
            actual: url?.host,
        });
        console.log(!hasPreviewDomain ? '  ✓ No preview domain' : `  ✗ Preview domain detected: ${url?.host}`);
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
        path.join(ARTIFACTS_DIR, 'local_magic_link.json'),
        JSON.stringify({
            timestamp: new Date().toISOString(),
            baseUrl: BASE_URL,
            env: {
                APP_ENV: process.env.APP_ENV,
                AUTH_BASE_URL: process.env.AUTH_BASE_URL,
                EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
            },
            passed,
            failed,
            results,
            outbox: outboxData,
        }, null, 2)
    );

    console.log(`\n✓ Artifacts saved to ${ARTIFACTS_DIR}/local_magic_link.json`);

    if (failed > 0) {
        console.log('\n⛔ PHASE 36.3 LOCAL MAGIC LINK: FAILED');
        process.exit(1);
    } else {
        console.log('\n✓ PHASE 36.3 LOCAL MAGIC LINK: PASSED');
    }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

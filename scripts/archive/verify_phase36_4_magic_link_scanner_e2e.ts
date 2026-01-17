#!/usr/bin/env npx tsx
/**
 * PHASE 36.4 — Magic Link Scanner E2E Test
 * 
 * Proves that email link scanners cannot consume login tokens.
 * 
 * Test flow:
 * 1. Request magic link (test transport)
 * 2. Scanner simulation: GET /auth/consume?token=... (page loads, no consumption)
 * 3. Human simulation: Click "Continue" button (POST succeeds)
 * 4. Second use: Shows error (token already used)
 */

import './_bootstrap';
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test-scanner@inpsyq.com';
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase36_4');
const OUTBOX_FILE = path.join(process.cwd(), 'artifacts', 'email_outbox', 'last_magic_link.json');

interface TestResult {
    test: string;
    passed: boolean;
    details?: any;
    error?: string;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 36.4 — Magic Link Scanner E2E Test');
    console.log(`  Target: ${BASE_URL}`);
    console.log(`  EMAIL_PROVIDER: ${process.env.EMAIL_PROVIDER}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (process.env.EMAIL_PROVIDER !== 'test') {
        console.error('⛔ EMAIL_PROVIDER must be "test" for this verification');
        console.error('   Run with: EMAIL_PROVIDER=test npx tsx ...');
        process.exit(1);
    }

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    const results: TestResult[] = [];
    let browser: Browser | null = null;
    let magicLink: string | null = null;

    try {
        // ─────────────────────────────────────────────────────────────────
        // Step 1: Request magic link
        // ─────────────────────────────────────────────────────────────────
        console.log('Step 1: Request magic link...');
        try {
            // Clean previous outbox
            if (fs.existsSync(OUTBOX_FILE)) {
                fs.unlinkSync(OUTBOX_FILE);
            }

            const res = await fetch(`${BASE_URL}/api/auth/request-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: TEST_EMAIL }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(`Request failed: ${JSON.stringify(data)}`);
            }

            // Wait for file to be written
            await new Promise(r => setTimeout(r, 500));

            if (!fs.existsSync(OUTBOX_FILE)) {
                throw new Error('Outbox file not created');
            }

            const outbox = JSON.parse(fs.readFileSync(OUTBOX_FILE, 'utf-8'));
            magicLink = outbox.extractedLink;

            if (!magicLink) {
                throw new Error('No magic link found in outbox');
            }

            // Verify it's the confirm page URL, not API
            if (magicLink.includes('/api/auth/consume')) {
                throw new Error(`Link still points to API: ${magicLink}`);
            }

            if (!magicLink.includes('/auth/consume')) {
                throw new Error(`Link missing /auth/consume: ${magicLink}`);
            }

            results.push({
                test: 'Request magic link',
                passed: true,
                details: { link: magicLink.replace(/token=[^&]+/, 'token=***') },
            });
            console.log('  ✓ Magic link received');
            console.log(`  Link: ${magicLink.replace(/token=[^&]+/, 'token=***')}`);
        } catch (e: any) {
            results.push({ test: 'Request magic link', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}`);
            throw e; // Cannot continue
        }

        // ─────────────────────────────────────────────────────────────────
        // Step 2: Scanner simulation - GET confirm page
        // ─────────────────────────────────────────────────────────────────
        console.log('\nStep 2: Scanner simulation (GET confirm page)...');
        browser = await chromium.launch({ headless: true });

        try {
            const context = await browser.newContext();
            const page = await context.newPage();

            // Navigate to magic link (what a scanner would do)
            await page.goto(magicLink!, { waitUntil: 'networkidle', timeout: 15000 });

            // Should see consume page
            const consumePage = await page.waitForSelector('[data-testid="consume-page"]', { timeout: 5000 });
            if (!consumePage) throw new Error('consume-page not found');

            // Should see Continue button
            const continueBtn = await page.$('[data-testid="consume-continue"]');
            if (!continueBtn) throw new Error('consume-continue button not found');

            // Screenshot
            await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_consume_page.png'), fullPage: true });

            // Wait 2 seconds - page should NOT auto-navigate
            const urlBefore = page.url();
            await new Promise(r => setTimeout(r, 2000));
            const urlAfter = page.url();

            if (urlBefore !== urlAfter) {
                throw new Error(`Page auto-navigated from ${urlBefore} to ${urlAfter}`);
            }

            results.push({
                test: 'Scanner simulation (GET)',
                passed: true,
                details: { url: urlAfter, stayedOnPage: true },
            });
            console.log('  ✓ Page loaded without auto-consuming token');
            console.log('  ✓ Page did NOT auto-navigate after 2 seconds');

            await context.close();
        } catch (e: any) {
            results.push({ test: 'Scanner simulation (GET)', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Step 3: Human simulation - Click Continue
        // ─────────────────────────────────────────────────────────────────
        console.log('\nStep 3: Human simulation (click Continue)...');
        try {
            const context = await browser.newContext();
            const page = await context.newPage();

            await page.goto(magicLink!, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForSelector('[data-testid="consume-page"]', { timeout: 5000 });

            // Click Continue
            await page.click('[data-testid="consume-continue"]');

            // Wait for navigation
            await page.waitForURL((url) => !url.pathname.includes('/auth/consume'), { timeout: 10000 });

            const finalUrl = page.url();

            // Screenshot
            await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_after_continue.png'), fullPage: true });

            // Should have redirected to a dashboard page
            const validRedirects = ['/admin', '/executive', '/team', '/measure', '/org/select', '/session'];
            const redirectedCorrectly = validRedirects.some(p => finalUrl.includes(p));

            results.push({
                test: 'Human simulation (click Continue)',
                passed: redirectedCorrectly,
                details: { finalUrl },
            });
            console.log(redirectedCorrectly ? `  ✓ Redirected to: ${finalUrl}` : `  ✗ Unexpected redirect: ${finalUrl}`);

            await context.close();
        } catch (e: any) {
            results.push({ test: 'Human simulation (click Continue)', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Step 4: Second use - Should fail
        // ─────────────────────────────────────────────────────────────────
        console.log('\nStep 4: Second use (should fail)...');
        try {
            const context = await browser.newContext();
            const page = await context.newPage();

            await page.goto(magicLink!, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForSelector('[data-testid="consume-page"]', { timeout: 5000 });

            // Click Continue again
            await page.click('[data-testid="consume-continue"]');

            // Wait for error state
            await page.waitForSelector('[data-testid="consume-error"]', { timeout: 10000 });

            // Screenshot
            await page.screenshot({ path: path.join(ARTIFACTS_DIR, '03_second_use_error.png'), fullPage: true });

            results.push({
                test: 'Second use shows error',
                passed: true,
            });
            console.log('  ✓ Second use correctly shows error');

            await context.close();
        } catch (e: any) {
            results.push({ test: 'Second use shows error', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}`);
        }

    } catch (e: any) {
        console.error('Critical error:', e.message);
    } finally {
        if (browser) await browser.close();
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    for (const r of results) {
        console.log(`  ${r.passed ? '✓' : '✗'} ${r.test}${r.error ? ` (${r.error})` : ''}`);
    }
    console.log(`\nTotal: ${passed}/${results.length} passed`);

    // Save artifact
    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'summary.json'),
        JSON.stringify({
            timestamp: new Date().toISOString(),
            baseUrl: BASE_URL,
            passed,
            failed,
            results,
        }, null, 2)
    );

    console.log(`\n✓ Artifacts saved to ${ARTIFACTS_DIR}/`);

    if (failed > 0) {
        console.log('\n⛔ PHASE 36.4 SCANNER E2E: FAILED');
        process.exit(1);
    } else {
        console.log('\n✓ PHASE 36.4 SCANNER E2E: PASSED');
    }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

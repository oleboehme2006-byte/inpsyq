#!/usr/bin/env npx tsx
/**
 * PHASE 33 — Production Chrome Verification
 * 
 * Browser-based validation of production environment.
 * Uses Playwright Chromium against www.inpsyq.com.
 */

import './_bootstrap';
import { chromium, Browser, ConsoleMessage } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const PROD_URL = process.env.PROD_URL || 'https://www.inpsyq.com';
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase33');

interface TestResult {
    test: string;
    passed: boolean;
    screenshot?: string;
    error?: string;
}

// Banned text on public pages
const BANNED_TEXT = ['Data Unavailable', 'Run pipeline', 'npm run pipeline'];

// Console patterns that fail
const FAIL_CONSOLE = [
    /Unhandled Runtime Error/i,
    /Cannot update a component/i,
    /TypeError:/i,
    /ReferenceError:/i,
];

// Ignore patterns
const IGNORE_CONSOLE = [
    /hot-reloader/i,
    /Fast Refresh/i,
    /webpack/i,
    /\[HMR\]/i,
    /Download the React DevTools/i,
    /Plausible/i,
];

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 33 — Production Chrome Verification');
    console.log(`  Target: ${PROD_URL}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    const results: TestResult[] = [];
    const consoleErrors: string[] = [];
    let browser: Browser | null = null;

    try {
        console.log('Launching Chrome...');
        browser = await chromium.launch({ headless: true });

        // Public pages
        const publicPages = [
            { name: 'Landing', path: '/', testid: 'landing-page', file: 'prod_01_landing.png' },
            { name: 'Demo', path: '/demo', testid: 'demo-page', file: 'prod_02_demo.png' },
            { name: 'Login', path: '/login', testid: 'login-email', file: 'prod_03_login.png' },
            { name: 'Privacy', path: '/privacy', testid: 'privacy-page', file: 'prod_04_privacy.png' },
            { name: 'Terms', path: '/terms', testid: 'terms-page', file: 'prod_05_terms.png' },
            { name: 'Imprint', path: '/imprint', testid: 'imprint-page', file: 'prod_06_imprint.png' },
        ];

        for (const pg of publicPages) {
            console.log(`Test: ${pg.name} page (${pg.path})...`);
            try {
                const context = await browser.newContext();
                const page = await context.newPage();

                // Track console
                page.on('console', (msg: ConsoleMessage) => {
                    const text = msg.text();
                    for (const pattern of FAIL_CONSOLE) {
                        if (pattern.test(text)) {
                            let shouldIgnore = false;
                            for (const ip of IGNORE_CONSOLE) {
                                if (ip.test(text)) { shouldIgnore = true; break; }
                            }
                            if (!shouldIgnore) {
                                consoleErrors.push(`[${pg.name}] ${text.slice(0, 150)}`);
                            }
                        }
                    }
                });

                await page.goto(`${PROD_URL}${pg.path}`, { waitUntil: 'networkidle', timeout: 30000 });

                // Wait for testid
                const el = await page.waitForSelector(`[data-testid="${pg.testid}"]`, { timeout: 15000 });
                const found = !!el;

                // Check for banned text
                const content = await page.textContent('body') || '';
                let bannedFound = null;
                for (const banned of BANNED_TEXT) {
                    if (content.includes(banned)) {
                        bannedFound = banned;
                        break;
                    }
                }

                // Screenshot
                const screenshotPath = path.join(ARTIFACTS_DIR, pg.file);
                await page.screenshot({ path: screenshotPath, fullPage: true });

                if (bannedFound) {
                    results.push({
                        test: pg.name,
                        passed: false,
                        screenshot: pg.file,
                        error: `Contains banned text: "${bannedFound}"`,
                    });
                    console.log(`  ✗ Banned text found: "${bannedFound}"`);
                } else if (!found) {
                    results.push({
                        test: pg.name,
                        passed: false,
                        screenshot: pg.file,
                        error: `Missing testid: ${pg.testid}`,
                    });
                    console.log(`  ✗ Missing testid`);
                } else {
                    results.push({
                        test: pg.name,
                        passed: true,
                        screenshot: pg.file,
                    });
                    console.log(`  ✓ Passed`);
                }

                await context.close();
            } catch (e: any) {
                results.push({ test: pg.name, passed: false, error: e.message });
                console.log(`  ✗ ${e.message}`);
            }
        }

        // Auth redirect tests
        console.log('\n=== Auth Redirect Tests ===\n');

        const authRedirects = [
            { name: 'Executive redirect', path: '/executive' },
            { name: 'Admin redirect', path: '/admin' },
            { name: 'Employee session redirect', path: '/employee/session' },
        ];

        for (const ar of authRedirects) {
            console.log(`Test: ${ar.name}...`);
            try {
                const context = await browser.newContext();
                const page = await context.newPage();

                await page.goto(`${PROD_URL}${ar.path}`, { waitUntil: 'networkidle', timeout: 20000 });

                const finalUrl = page.url();
                const redirectedToLogin = finalUrl.includes('/login');
                const hasLoginForm = await page.$('[data-testid="login-email"]');

                results.push({
                    test: ar.name,
                    passed: redirectedToLogin || !!hasLoginForm,
                    error: !redirectedToLogin && !hasLoginForm ? 'Did not redirect to login' : undefined,
                });

                console.log(redirectedToLogin || hasLoginForm ? '  ✓ Redirects to login' : '  ✗ No redirect');

                await context.close();
            } catch (e: any) {
                results.push({ test: ar.name, passed: false, error: e.message });
                console.log(`  ✗ ${e.message}`);
            }
        }

        // Demo mode banner
        console.log('\nTest: Demo mode banner...');
        try {
            const context = await browser.newContext();
            const page = await context.newPage();
            await page.goto(`${PROD_URL}/demo`, { waitUntil: 'networkidle', timeout: 20000 });
            const banner = await page.$('[data-testid="demo-mode-banner"]');

            results.push({ test: 'Demo mode banner', passed: !!banner });
            console.log(banner ? '  ✓ Banner found' : '  ✗ Missing banner');
            await context.close();
        } catch (e: any) {
            results.push({ test: 'Demo mode banner', passed: false, error: e.message });
        }

    } catch (e: any) {
        console.error('Critical error:', e.message);
        results.push({ test: 'Critical', passed: false, error: e.message });
    } finally {
        if (browser) await browser.close();
    }

    // Console check
    console.log('\n=== Console Error Check ===');
    if (consoleErrors.length > 0) {
        console.log(`⛔ ${consoleErrors.length} console errors detected:`);
        for (const err of consoleErrors.slice(0, 5)) {
            console.log(`  • ${err}`);
        }
        results.push({ test: 'Console clean', passed: false, error: `${consoleErrors.length} errors` });
    } else {
        console.log('✓ Console is clean');
        results.push({ test: 'Console clean', passed: true });
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

    // Save
    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'prod_chrome.json'),
        JSON.stringify({
            timestamp: new Date().toISOString(),
            prodUrl: PROD_URL,
            passed,
            failed,
            consoleErrors,
            results,
        }, null, 2)
    );

    console.log(`\n✓ Artifacts saved to ${ARTIFACTS_DIR}/prod_chrome.json`);

    if (failed > 0) {
        console.log('\n⛔ PHASE 33 PROD CHROME: FAILED');
        process.exit(1);
    } else {
        console.log('\n✓ PHASE 33 PROD CHROME: PASSED');
    }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

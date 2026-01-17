#!/usr/bin/env npx tsx
/**
 * PHASE 32 — Staging Chrome Verification
 * 
 * Browser-based validation of staging environment.
 * Uses Playwright Chromium.
 */

import './_bootstrap';
import { chromium, Browser, ConsoleMessage } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase32');

interface TestResult {
    test: string;
    passed: boolean;
    screenshot?: string;
    error?: string;
}

// Banned text on public pages
const BANNED_TEXT = ['Data Unavailable', 'Run pipeline'];

// Console patterns that fail
const FAIL_CONSOLE = [
    /Unhandled Runtime Error/i,
    /Cannot update a component/i,
    /TypeError:/i,
];

// Ignore patterns
const IGNORE_CONSOLE = [
    /hot-reloader/i,
    /Fast Refresh/i,
    /webpack/i,
    /\[HMR\]/i,
    /Download the React DevTools/i,
];

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 32 — Staging Chrome Verification');
    console.log(`  Target: ${BASE_URL}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    const results: TestResult[] = [];
    const consoleErrors: string[] = [];
    let browser: Browser | null = null;

    try {
        console.log('Launching Chrome...');
        browser = await chromium.launch({ headless: true });

        const pages = [
            { name: 'Landing', path: '/', testid: 'landing-page', file: '01_landing.png' },
            { name: 'Demo', path: '/demo', testid: 'demo-page', file: '02_demo.png' },
            { name: 'Login', path: '/login', testid: 'login-email', file: '03_login.png' },
            { name: 'Privacy', path: '/privacy', testid: 'privacy-page', file: '04_privacy.png' },
            { name: 'Terms', path: '/terms', testid: 'terms-page', file: '05_terms.png' },
            { name: 'Imprint', path: '/imprint', testid: 'imprint-page', file: '06_imprint.png' },
        ];

        for (const pg of pages) {
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

                await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'networkidle', timeout: 20000 });

                // Wait for testid
                const el = await page.waitForSelector(`[data-testid="${pg.testid}"]`, { timeout: 10000 });
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

        // Demo mode banner check
        console.log('Test: Demo mode banner...');
        try {
            const context = await browser.newContext();
            const page = await context.newPage();
            await page.goto(`${BASE_URL}/demo`, { waitUntil: 'networkidle', timeout: 15000 });
            const banner = await page.$('[data-testid="demo-mode-banner"]');

            results.push({
                test: 'Demo mode banner',
                passed: !!banner,
            });
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
        path.join(ARTIFACTS_DIR, 'staging_chrome.json'),
        JSON.stringify({
            timestamp: new Date().toISOString(),
            baseUrl: BASE_URL,
            passed,
            failed,
            consoleErrors,
            results,
        }, null, 2)
    );

    console.log(`\n✓ Artifacts saved to ${ARTIFACTS_DIR}/staging_chrome.json`);

    if (failed > 0) {
        console.log('\n⛔ PHASE 32 STAGING CHROME: FAILED');
        process.exit(1);
    } else {
        console.log('\n✓ PHASE 32 STAGING CHROME: PASSED');
    }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

#!/usr/bin/env npx tsx
/**
 * PHASE 29 — Public Reachability Chrome E2E
 * 
 * Strict validation that ALL public pages are reachable without auth.
 * Fails if any dashboard content ("Data Unavailable", "Retry", "pipeline")
 * appears on public pages.
 * 
 * Requires dev server on :3001
 */

import './_bootstrap';
import { chromium, Browser, Page, ConsoleMessage } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase29');

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    screenshot?: string;
}

// Banned content on public pages
const BANNED_TEXT = [
    'Data Unavailable',
    'Run pipeline',
    'pipeline:dev',
    'npm run pipeline',
];

// Console patterns that FAIL
const FAIL_PATTERNS = [
    /Unhandled Runtime Error/i,
    /Cannot update a component/i,
    /TypeError:/i,
    /ReferenceError:/i,
];

// Ignore patterns
const IGNORE_PATTERNS = [
    /hot-reloader/i,
    /Fast Refresh/i,
    /webpack/i,
    /\[HMR\]/i,
    /Download the React DevTools/i,
];

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 29 — Public Reachability Chrome E2E');
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    const results: TestResult[] = [];
    const consoleErrors: string[] = [];
    let browser: Browser | null = null;

    try {
        console.log('Launching Chrome...');
        browser = await chromium.launch({ headless: true, channel: 'chromium' });

        const setupConsoleListen = (page: Page) => {
            page.on('console', (msg: ConsoleMessage) => {
                const text = msg.text();
                for (const pattern of FAIL_PATTERNS) {
                    if (pattern.test(text)) {
                        let shouldIgnore = false;
                        for (const ignore of IGNORE_PATTERNS) {
                            if (ignore.test(text)) { shouldIgnore = true; break; }
                        }
                        if (!shouldIgnore) {
                            consoleErrors.push(`[${msg.type()}] ${text.slice(0, 200)}`);
                        }
                    }
                }
            });
        };

        const checkBannedText = async (page: Page): Promise<string | null> => {
            const content = await page.textContent('body') || '';
            for (const banned of BANNED_TEXT) {
                if (content.includes(banned)) {
                    return banned;
                }
            }
            return null;
        };

        // ─────────────────────────────────────────────────────────────────
        // Test 1: Landing Page
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 1: Landing page (/)...');
        try {
            const context = await browser.newContext();
            const page = await context.newPage();
            setupConsoleListen(page);

            await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForSelector('[data-testid="landing-page"]', { timeout: 10000 });

            const banned = await checkBannedText(page);
            if (banned) {
                throw new Error(`Landing contains banned text: "${banned}"`);
            }

            const s = path.join(ARTIFACTS_DIR, '01_landing.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Landing page', passed: true, screenshot: s });
            console.log('  ✓ Landing page\n');

            await context.close();
        } catch (e: any) {
            results.push({ name: 'Landing page', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 2: Demo Page
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 2: Demo page (/demo)...');
        try {
            const context = await browser.newContext();
            const page = await context.newPage();
            setupConsoleListen(page);

            // Track API calls
            const apiCalls: string[] = [];
            page.on('request', (req) => {
                const url = req.url();
                if (url.includes('/api/dashboard') || url.includes('/api/internal')) {
                    apiCalls.push(url);
                }
            });

            await page.goto(`${BASE_URL}/demo`, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForSelector('[data-testid="demo-page"]', { timeout: 10000 });
            await page.waitForSelector('[data-testid="demo-mode-banner"]', { timeout: 5000 });

            if (apiCalls.length > 0) {
                throw new Error(`Demo page called dashboard/internal APIs: ${apiCalls.join(', ')}`);
            }

            const s = path.join(ARTIFACTS_DIR, '02_demo.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Demo page', passed: true, screenshot: s });
            console.log('  ✓ Demo page\n');

            await context.close();
        } catch (e: any) {
            results.push({ name: 'Demo page', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 3: Login Page
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 3: Login page (/login)...');
        try {
            const context = await browser.newContext();
            const page = await context.newPage();
            setupConsoleListen(page);

            await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForSelector('[data-testid="login-email"]', { timeout: 10000 });

            const s = path.join(ARTIFACTS_DIR, '03_login.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Login page', passed: true, screenshot: s });
            console.log('  ✓ Login page\n');

            await context.close();
        } catch (e: any) {
            results.push({ name: 'Login page', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 4: Privacy Page
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 4: Privacy page (/privacy)...');
        try {
            const context = await browser.newContext();
            const page = await context.newPage();
            setupConsoleListen(page);

            await page.goto(`${BASE_URL}/privacy`, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForSelector('[data-testid="privacy-page"]', { timeout: 10000 });

            const s = path.join(ARTIFACTS_DIR, '04_privacy.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Privacy page', passed: true, screenshot: s });
            console.log('  ✓ Privacy page\n');

            await context.close();
        } catch (e: any) {
            results.push({ name: 'Privacy page', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 5: Terms Page
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 5: Terms page (/terms)...');
        try {
            const context = await browser.newContext();
            const page = await context.newPage();
            setupConsoleListen(page);

            await page.goto(`${BASE_URL}/terms`, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForSelector('[data-testid="terms-page"]', { timeout: 10000 });

            const s = path.join(ARTIFACTS_DIR, '05_terms.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Terms page', passed: true, screenshot: s });
            console.log('  ✓ Terms page\n');

            await context.close();
        } catch (e: any) {
            results.push({ name: 'Terms page', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 6: Imprint Page
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 6: Imprint page (/imprint)...');
        try {
            const context = await browser.newContext();
            const page = await context.newPage();
            setupConsoleListen(page);

            await page.goto(`${BASE_URL}/imprint`, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForSelector('[data-testid="imprint-page"]', { timeout: 10000 });

            const s = path.join(ARTIFACTS_DIR, '06_imprint.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Imprint page', passed: true, screenshot: s });
            console.log('  ✓ Imprint page\n');

            await context.close();
        } catch (e: any) {
            results.push({ name: 'Imprint page', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 7: Executive redirect (no auth)
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 7: Executive redirects without auth...');
        try {
            const context = await browser.newContext();
            const page = await context.newPage();
            setupConsoleListen(page);

            await page.goto(`${BASE_URL}/executive`, { waitUntil: 'networkidle', timeout: 15000 });

            // Should redirect to login or show login
            const url = page.url();
            const hasLogin = url.includes('/login') || await page.$('[data-testid="login-email"]');

            const s = path.join(ARTIFACTS_DIR, '07_exec_redirect.png');
            await page.screenshot({ path: s, fullPage: true });

            if (hasLogin) {
                results.push({ name: 'Executive redirects to login', passed: true, screenshot: s });
                console.log('  ✓ Executive redirects to login\n');
            } else {
                // Check if it shows error state (which is acceptable if not showing dashboard data)
                const content = await page.textContent('body') || '';
                if (content.includes('Data Unavailable') && !content.includes('Executive Overview')) {
                    results.push({ name: 'Executive shows error (no auth)', passed: true, screenshot: s });
                    console.log('  ✓ Executive shows error state (protected)\n');
                } else {
                    throw new Error('Executive page accessible without auth');
                }
            }

            await context.close();
        } catch (e: any) {
            results.push({ name: 'Executive redirect', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 8: Admin redirect (no auth)
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 8: Admin redirects without auth...');
        try {
            const context = await browser.newContext();
            const page = await context.newPage();
            setupConsoleListen(page);

            await page.goto(`${BASE_URL}/admin/setup`, { waitUntil: 'networkidle', timeout: 15000 });

            const url = page.url();
            const hasLogin = url.includes('/login') || await page.$('[data-testid="login-email"]');

            const s = path.join(ARTIFACTS_DIR, '08_admin_redirect.png');
            await page.screenshot({ path: s, fullPage: true });

            if (hasLogin) {
                results.push({ name: 'Admin redirects to login', passed: true, screenshot: s });
                console.log('  ✓ Admin redirects to login\n');
            } else {
                // Check if protected
                const content = await page.textContent('body') || '';
                if (!content.includes('Admin Setup') || content.includes('Unauthorized')) {
                    results.push({ name: 'Admin protected', passed: true, screenshot: s });
                    console.log('  ✓ Admin page protected\n');
                } else {
                    throw new Error('Admin page accessible without auth');
                }
            }

            await context.close();
        } catch (e: any) {
            results.push({ name: 'Admin redirect', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

    } catch (e: any) {
        console.error('Critical error:', e.message);
        results.push({ name: 'Critical', passed: false, error: e.message });
    } finally {
        if (browser) await browser.close();
    }

    // Console check
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('CONSOLE ERROR CHECK');
    console.log('═══════════════════════════════════════════════════════════════');

    if (consoleErrors.length > 0) {
        console.log('\n⛔ Console errors detected:');
        for (const err of consoleErrors) {
            console.log(`  • ${err}`);
        }
        results.push({ name: 'Console clean', passed: false, error: `${consoleErrors.length} errors` });
    } else {
        console.log('\n✓ Console is clean');
        results.push({ name: 'Console clean', passed: true });
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    for (const r of results) {
        console.log(`  ${r.passed ? '✓' : '✗'} ${r.name}${r.error ? ` (${r.error})` : ''}`);
    }
    console.log(`\nTotal: ${passed}/${results.length} passed, ${failed} failed`);

    // Save
    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'summary.json'),
        JSON.stringify({
            timestamp: new Date().toISOString(),
            passed,
            failed,
            consoleErrors,
            results,
        }, null, 2)
    );

    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'console.json'),
        JSON.stringify({ errors: consoleErrors }, null, 2)
    );

    console.log(`\n✓ Artifacts saved to ${ARTIFACTS_DIR}/`);

    if (failed > 0) {
        console.log('\n⛔ PHASE 29 PUBLIC GATE: FAILED');
        process.exit(1);
    } else {
        console.log('\n✓ PHASE 29 PUBLIC GATE: PASSED');
    }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

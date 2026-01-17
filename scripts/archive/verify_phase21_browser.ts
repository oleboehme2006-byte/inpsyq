/**
 * PHASE 21.F — Playwright Browser Verification
 * 
 * Uses Playwright to:
 * 1. Login via dev endpoint
 * 2. Visit key pages
 * 3. Check for error states
 * 4. Capture screenshots
 * 5. Output DOM summary
 */

import './_bootstrap';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.VERIFY_BASE_URL || 'http://localhost:3001';
const FIXTURE_USER_ID = '33333333-3333-4333-8333-000000000001';
const FIXTURE_TEAM_ID = '22222222-2222-4222-8222-222222222201';

const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase21');
const IS_MOCK_MODE = process.env.NEXT_PUBLIC_DASHBOARD_DEV_MOCKS === 'true';
const MODE_DIR = IS_MOCK_MODE ? 'mock' : 'real';

interface PageCheck {
    url: string;
    name: string;
    expectNoDataUnavailable: boolean;
    expectNoTeamNotFound: boolean;
    checkDemoOverlay: boolean;
    interact?: boolean;
}

interface PageResult {
    url: string;
    name: string;
    status: 'PASS' | 'FAIL';
    h1Text: string;
    hasDataUnavailable: boolean;
    hasTeamNotFound: boolean;
    hasMockBadge: boolean;
    hasDemoOverlay: boolean;
    screenshotPath: string;
    error?: string;
}

async function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function login(context: BrowserContext): Promise<boolean> {
    try {
        const response = await context.request.post(`${BASE_URL}/api/internal/dev/login`, {
            data: { user_id: FIXTURE_USER_ID },
        });
        return response.status() === 200;
    } catch (e) {
        console.error('Login failed:', e);
        return false;
    }
}

async function checkPage(page: Page, check: PageCheck): Promise<PageResult> {
    const result: PageResult = {
        url: check.url,
        name: check.name,
        status: 'PASS',
        h1Text: '',
        hasDataUnavailable: false,
        hasTeamNotFound: false,
        hasMockBadge: false,
        hasDemoOverlay: false,
        screenshotPath: '',
    };

    try {
        await page.goto(`${BASE_URL}${check.url}`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000); // Allow animations to settle

        // Get page content
        const content = await page.content();

        // Check H1
        const h1 = await page.$('h1');
        result.h1Text = h1 ? await h1.textContent() || '' : '';

        // Check error states
        result.hasDataUnavailable = content.includes('Data Unavailable') || content.includes('NO_DATA');
        result.hasTeamNotFound = content.includes('Team Not Found') || content.includes('not found');
        result.hasMockBadge = content.includes('MOCK DATA');

        // Check demo overlay
        if (check.checkDemoOverlay) {
            result.hasDemoOverlay = content.includes('hint') || content.includes('overlay') ||
                await page.$('[class*="hint"]') !== null ||
                await page.$('[class*="overlay"]') !== null;
        }

        // Interact if requested
        if (check.interact) {
            // Scroll down
            await page.evaluate(() => window.scrollBy(0, 500));
            await page.waitForTimeout(500);

            // Try to click something interactive
            const clickable = await page.$('button, [role="button"], tr[class*="cursor-pointer"]');
            if (clickable) {
                await clickable.click().catch(() => { });
                await page.waitForTimeout(500);
            }
        }

        // Screenshot
        const screenshotName = `${check.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
        const screenshotPath = path.join(ARTIFACTS_DIR, MODE_DIR, screenshotName);
        await ensureDir(path.dirname(screenshotPath));
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.screenshotPath = screenshotPath;

        // Determine pass/fail
        if (check.expectNoDataUnavailable && result.hasDataUnavailable) {
            result.status = 'FAIL';
            result.error = 'Page shows "Data Unavailable"';
        }
        if (check.expectNoTeamNotFound && result.hasTeamNotFound) {
            result.status = 'FAIL';
            result.error = 'Page shows "Team Not Found"';
        }

    } catch (e: any) {
        result.status = 'FAIL';
        result.error = e.message;
    }

    return result;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 21.F — Playwright Browser Verification');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Mode: ${IS_MOCK_MODE ? 'MOCK' : 'REAL'}`);
    console.log('');

    await ensureDir(path.join(ARTIFACTS_DIR, MODE_DIR));

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    // Login
    console.log('Logging in...');
    const loginSuccess = await login(context);
    if (!loginSuccess) {
        console.log('\x1b[31m✗ Login failed\x1b[0m');
        await browser.close();
        process.exit(1);
    }
    console.log('\x1b[32m✓ Logged in\x1b[0m');
    console.log('');

    const page = await context.newPage();

    const checks: PageCheck[] = [
        {
            url: '/',
            name: 'Landing',
            expectNoDataUnavailable: false,
            expectNoTeamNotFound: false,
            checkDemoOverlay: false,
        },
        {
            url: '/executive',
            name: 'Executive',
            expectNoDataUnavailable: !IS_MOCK_MODE,
            expectNoTeamNotFound: false,
            checkDemoOverlay: false,
            interact: true,
        },
        {
            url: '/executive?demo=true',
            name: 'Executive_Demo',
            expectNoDataUnavailable: false,
            expectNoTeamNotFound: false,
            checkDemoOverlay: true,
        },
        {
            url: `/team/${FIXTURE_TEAM_ID}`,
            name: 'Team',
            expectNoDataUnavailable: !IS_MOCK_MODE,
            expectNoTeamNotFound: true,
            checkDemoOverlay: false,
            interact: true,
        },
        {
            url: `/team/${FIXTURE_TEAM_ID}?demo=true`,
            name: 'Team_Demo',
            expectNoDataUnavailable: false,
            expectNoTeamNotFound: false,
            checkDemoOverlay: true,
        },
    ];

    const results: PageResult[] = [];

    for (const check of checks) {
        console.log(`Checking ${check.name}...`);
        const result = await checkPage(page, check);
        results.push(result);

        const icon = result.status === 'PASS' ? '✓' : '✗';
        const color = result.status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
        console.log(`${color}${icon}\x1b[0m ${result.name}: ${result.status}${result.error ? ` — ${result.error}` : ''}`);
        console.log(`   H1: ${result.h1Text || '(none)'}, Mock: ${result.hasMockBadge}, Demo: ${result.hasDemoOverlay}`);
    }

    await browser.close();

    // Write summary JSON
    const summaryPath = path.join(ARTIFACTS_DIR, `summary.${MODE_DIR}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify({
        mode: IS_MOCK_MODE ? 'mock' : 'real',
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        results,
    }, null, 2));
    console.log('');
    console.log(`Summary written to: ${summaryPath}`);

    const failed = results.filter(r => r.status === 'FAIL');
    console.log('');
    if (failed.length > 0) {
        console.log('\x1b[31m✗ BROWSER VERIFICATION FAILED\x1b[0m');
        console.log(`${failed.length} page(s) failed checks.`);
        process.exit(1);
    } else {
        console.log('\x1b[32m✓ BROWSER VERIFICATION PASSED\x1b[0m');

        // Mode-specific checks
        if (IS_MOCK_MODE) {
            const hasMockBadges = results.filter(r => r.name.includes('Executive') || r.name.includes('Team'))
                .every(r => r.hasMockBadge);
            if (!hasMockBadges) {
                console.log('\x1b[33m⚠ Expected MOCK DATA badge on dashboards in mock mode\x1b[0m');
            }
        } else {
            const hasNoMockBadges = results.every(r => !r.hasMockBadge);
            if (!hasNoMockBadges) {
                console.log('\x1b[33m⚠ Unexpected MOCK DATA badge found in real mode\x1b[0m');
            }
        }
    }
}

main().catch(e => {
    console.error('Browser verification error:', e.message);
    process.exit(1);
});

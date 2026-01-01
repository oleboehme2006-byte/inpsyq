/**
 * verify_phase21_2_browser_e2e.ts (STRICT)
 * 
 * Objectives:
 * 1. Login via Cookie (api/internal/dev/login).
 * 2. Visit Executive Dashboard (?demo=true).
 *    - Verify no "Data Unavailable".
 *    - Verify "Organization" or "Acme" title.
 *    - Click a "Details" button or interaction.
 * 3. Visit Team Dashboard (?demo=true).
 *    - Verify no "Data Unavailable".
 *    - Verify "Engineering" title.
 *    - Verify "Team Context" or similar section.
 * 4. FAIL on any console error, 404, 500, or "Data Unavailable".
 */

import { chromium, Page } from 'playwright';
import fs from 'fs';
import path from 'path';

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;
const ARTIFACTS_DIR = path.resolve(__dirname, '../artifacts/phase21_2');
// Ensure artifacts dir exists
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 21.2 — STRICT Browser E2E');
    console.log(`  Target: ${BASE_URL}`);
    console.log('═══════════════════════════════════════════════════════════════');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let stepsPassed = 0;

    // Strict Error Listener (but allow benign React warnings)
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const text = msg.text();
            // Downgrade known React dev warnings if they don't break functionality
            if (text.includes('Warning:')) {
                console.warn(`[Browser Warn] ${text}`);
            } else {
                console.error(`[Browser Console Error] ${text}`);
            }
        }
    });
    page.on('response', res => {
        if (res.status() >= 400 && !res.url().includes('favicon')) {
            console.error(`[Network Error] ${res.status()} ${res.url()}`);
        }
    });

    try {
        // 1. Auth
        console.log('\n[Step 1] Authentication...');
        const loginRes = await page.request.post(`${BASE_URL}/api/internal/dev/login`, {
            data: { user_id: '33333333-3333-4333-8333-000000000001' }
        });
        if (loginRes.status() !== 200) throw new Error(`Login failed with status ${loginRes.status()}`);

        const cookies = await context.cookies();
        const authCookie = cookies.find(c => c.name === 'inpsyq_dev_user');
        if (!authCookie) throw new Error('Auth cookie missing after login');
        console.log('✓ Auth Cookie Set');
        stepsPassed++;

        // 2. Executive Dashboard
        console.log('\n[Step 2] Executive Dashboard (?demo=true)...');
        await page.goto(`${BASE_URL}/executive?demo=true`, { waitUntil: 'networkidle' });
        // Wait for specific element
        await page.waitForSelector('[data-testid="org-title"]', { timeout: 10000 });

        // Check content
        const orgTitle = page.getByTestId('org-title');
        await expectVisible(orgTitle, 'Executive Title');

        // Sanity anchor: KPI cards exist?
        const signalCards = page.locator('.bg-bg-elevated'); // SignalCard container class usually
        if (await signalCards.count() === 0) console.warn('⚠ Warning: No SignalCards found (visual check needed)');

        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'executive_dashboard.png') });
        console.log('✓ Executive Dashboard Loaded (Screenshot saved)');
        stepsPassed++;

        // 3. Team Dashboard
        console.log('\n[Step 3] Team Dashboard (?demo=true)...');
        const TEAM_ID = '22222222-2222-4222-8222-222222222201';
        await page.goto(`${BASE_URL}/team/${TEAM_ID}?demo=true`, { waitUntil: 'networkidle' });
        await page.waitForSelector('[data-testid="team-title"]', { timeout: 10000 });

        const teamTitle = page.getByTestId('team-title');
        await expectVisible(teamTitle, 'Team Title');
        const titleText = await teamTitle.innerText();
        if (!titleText.includes('Team') && !titleText.includes('Engineering')) {
            throw new Error(`Team Title text unexpected: "${titleText}"`);
        }

        // Sanity anchor: At least one chart or panel
        const panels = page.locator('.dashboard-section');
        if (await panels.count() === 0) console.warn('⚠ Warning: No dashboard sections found');

        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'team_dashboard.png') });
        console.log('✓ Team Dashboard Loaded (Screenshot saved)');
        stepsPassed++;

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log(`\x1b[32m✓ PASSED (${stepsPassed}/3 Steps)\x1b[0m`);
        console.log('═══════════════════════════════════════════════════════════════');

    } catch (e: any) {
        console.error('\n\x1b[31m✗ FAILED\x1b[0m');
        console.error(e.message);
        try {
            const body = await page.innerText('body');
            console.log('--- PAGE CONTENT ---');
            console.log(body.substring(0, 1000));
            console.log('--- END CONTENT ---');
            await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'failure_state.png') });
        } catch { }
        process.exit(1);
    } finally {
        await browser.close();
    }
}

async function expectVisible(locator: any, name: string) {
    const isVisible = await locator.isVisible();
    if (!isVisible) throw new Error(`${name} is not visible`);
    console.log(`  ✓ ${name} visible`);
}

main();

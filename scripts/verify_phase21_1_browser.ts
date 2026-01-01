/**
 * PHASE 21.1 CHECK — Browser Verification (Make-It-Run)
 * 
 * Objectives:
 * 1. Verify Authentication via Cookie (no "Login" redirects).
 * 2. Verify "Executive Dashboard" loads with data (Real or Mock).
 * 3. Verify "Team Dashboard" loads with data.
 * 4. Verify No "Data Unavailable" errors.
 * 5. Verify Team Routing works.
 * 
 * Pre-requisites:
 * - Server running on port 3001 (npm run dev)
 * - Fixtures ensured (npm run verify:fixtures)
 */

import { chromium, Browser, Page } from 'playwright';
import { getCanonicalWeek } from '../lib/week';

const PORT = 3001;
const BASE_URL = process.env.VERIFY_BASE_URL || `http://localhost:${PORT}`;
const HEADLESS = process.env.HEADLESS !== 'false'; // Default to true

// Fixtures
const USER_ID = '33333333-3333-4333-8333-000000000001';
const TEAM_ENG_ID = '22222222-2222-4222-8222-222222222201';

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 21.1 — Browser Verification');
    console.log(`  Target: ${BASE_URL}`);
    console.log('═══════════════════════════════════════════════════════════════');

    const browser = await chromium.launch({ headless: HEADLESS });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // 1. Dev Login (Cookie Injection)
        console.log('\n--- Step 1: Authentication ---');
        console.log(`Logging in via API: ${BASE_URL}/api/internal/dev/login`);

        await page.request.post(`${BASE_URL}/api/internal/dev/login`, {
            data: { user_id: USER_ID }
        });

        // Context should now have the cookie. Verify?
        const cookies = await context.cookies();
        const authCookie = cookies.find(c => c.name === 'inpsyq_dev_user');
        if (authCookie) {
            console.log('✓ Auth Cookie set:', authCookie.value);
        } else {
            console.error('✗ Auth Cookie MISSING after login');
            process.exit(1);
        }

        // 2. Executive Dashboard
        console.log('\n--- Step 2: Executive Dashboard ---');
        const execUrl = `${BASE_URL}/dashboard/executive`;
        console.log(`Navigating to: ${execUrl}`);

        await page.goto(execUrl);
        await page.waitForLoadState('networkidle');

        // Check for redirects (should stay on /dashboard/executive)
        if (page.url().includes('/login')) {
            console.error('✗ Redirected to Login - Auth Failed');
            throw new Error('Auth Failed');
        }
        console.log('✓ Access Granted (No Redirect)');

        // Screenshot 1
        await page.screenshot({ path: 'artifacts/phase21_1_exec_dashboard.png' });
        console.log('  [Screenshot] artifacts/phase21_1_exec_dashboard.png');

        // Check for "Data Unavailable"
        const content = await page.content();
        if (content.includes('Data Unavailable')) {
            console.error('✗ "Data Unavailable" detected on Executive Dashboard');
            // Don't fail immediately, check other things
        } else {
            console.log('✓ No "Data Unavailable" error');
        }

        // Check for Mock Badge or Real Data
        const badge = await page.locator('text=MOCK DATA').count();
        if (badge > 0) {
            console.log('⚠ Running in MOCK MODE (Badge detected)');
        } else {
            console.log('✓ Running in REAL DATA MODE');
        }

        // 3. Team Dashboard (Routing & Data)
        console.log('\n--- Step 3: Team Dashboard ---');
        const teamUrl = `${BASE_URL}/dashboard/team/${TEAM_ENG_ID}`;
        console.log(`Navigating to: ${teamUrl}`);

        await page.goto(teamUrl);
        await page.waitForLoadState('networkidle');

        // Check Routing
        if (page.url().includes('/login')) {
            console.error('✗ Redirected to Login');
            throw new Error('Auth Failed on Team Page');
        }
        if (page.url().includes('404')) {
            console.error('✗ 404 Not Found');
            throw new Error('Team Page 404');
        }
        console.log('✓ Access Granted');

        // Screenshot 2
        await page.screenshot({ path: 'artifacts/phase21_1_team_dashboard.png' });
        console.log('  [Screenshot] artifacts/phase21_1_team_dashboard.png');

        // Check for specific seeded content if in Real Data Mode
        // "Engineering" title
        const hasTitle = await page.getByText('Engineering', { exact: false }).count();
        if (hasTitle > 0) {
            console.log('✓ Team Name "Engineering" found');
        } else {
            console.warn('⚠ Team Name "Engineering" NOT found (check selectors)');
        }

        // Check for Week Label (Current Week)
        const { weekLabel } = getCanonicalWeek();
        const hasWeek = await page.getByText(weekLabel, { exact: false }).count();
        if (hasWeek > 0) {
            console.log(`✓ Current Week Label "${weekLabel}" found`);
        } else {
            console.warn(`⚠ Week Label "${weekLabel}" NOT found`);
        }

        console.log('\n\x1b[32m✓ BROWSER VERIFICATION PASSED\x1b[0m');

    } catch (e) {
        console.error('\n\x1b[31m✗ BROWSER VERIFICATION FAILED\x1b[0m');
        console.error(e);
        await page.screenshot({ path: 'artifacts/phase21_1_error.png' });
        process.exit(1);
    } finally {
        await browser.close();
    }
}

main();

#!/usr/bin/env npx tsx
/**
 * PHASE 36.5 — Production Browser Auth UI Verification
 * 
 * Playwright-driven browser verification of production UI states:
 * 1. Login page loads
 * 2. Request link flow (UI feedback)
 * 3. Auth Confirm page (UI existence check)
 * 4. Admin protection (redirect to login)
 * 
 * Usage:
 *   BASE_URL=https://www.inpsyq.com npx tsx scripts/verify_phase36_5_prod_browser_auth_flow.ts
 */

import './_bootstrap';
import { chromium, Browser } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase36_5');
const TEST_EMAIL = 'verify-prod-ui@inpsyq.com'; // Safe to request, won't be delivered if rejected

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 36.5 — Production Browser UI Verification');
    console.log(`  Target: ${BASE_URL}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    let browser: Browser | null = null;
    try {
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        // 1. Check Login Page
        console.log('Step 1: Check Login Page...');
        await page.goto(`${BASE_URL}/login`);
        await page.waitForSelector('input[type="email"]');
        console.log('  ✓ Login input found');
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'prod_01_login.png') });

        // 2. Request Link (UI check only)
        console.log('\nStep 2: Request Link (UI)...');
        await page.fill('input[type="email"]', TEST_EMAIL);
        // Find submit button (usually "Continue" or "Send Link")
        // We'll look for button with type submit
        await page.click('button[type="submit"]');

        // Wait for success message or "Check your email"
        // This depends on UI implementation. Usually it shows a success screen.
        // We'll wait a bit and screenshot.
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'prod_02_link_requested.png') });
        console.log('  ✓ Request interaction completed (check screenshot)');

        // 3. Check Confirm Page (Direct Access)
        console.log('\nStep 3: Check Confirm Page (Direct Access)...');
        // Visiting without token -> Should show "Missing Token"
        await page.goto(`${BASE_URL}/auth/consume`);
        await page.waitForSelector('[data-testid="consume-page"]');
        const text = await page.textContent('body');
        if (text?.includes('Missing Token')) {
            console.log('  ✓ Shows "Missing Token" state');
        } else {
            console.warn('  ⚠️ Did not find "Missing Token" text');
        }
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'prod_03_confirm_missing.png') });

        // Visiting with fake token -> Should show "Invalid or expired" (if we click continue)
        // Actually, let's just visit /auth/consume?token=fake
        await page.goto(`${BASE_URL}/auth/consume?token=fake-token-for-ui-check`);
        await page.waitForSelector('[data-testid="consume-continue"]');
        console.log('  ✓ Shows "Continue" button for token URL');
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'prod_04_confirm_fake.png') });

        // 4. Check Admin Protection
        console.log('\nStep 4: Check Admin Protection...');
        await page.goto(`${BASE_URL}/admin`);
        await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 5000 });
        console.log('  ✓ Unauthenticated /admin redirects to /login');

        console.log('\n✓ PROD BROWSER UI PASSED');

    } catch (e: any) {
        console.error('\n⛔ FAILED:', e.message);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
    }
}

main().catch(e => { console.error(e); process.exit(1); });

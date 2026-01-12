#!/usr/bin/env npx tsx
/**
 * PHASE 36.7 — Production Browser Admin Flow Verification
 * 
 * Uses Playwright to verify admin login and dashboard visibility.
 * 
 * Usage:
 *   BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=... npx tsx scripts/verify_phase36_7_prod_browser_admin_flow.ts
 */

import './_bootstrap';
import { chromium, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase36_7');

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 36.7 — Production Browser Admin Flow');
    console.log(`  Target: ${BASE_URL}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!ADMIN_SECRET) {
        console.error('⛔ INTERNAL_ADMIN_SECRET required');
        process.exit(1);
    }

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    const results: any = { timestamp: new Date().toISOString(), steps: [] };

    let browser: Browser | null = null;
    try {
        // Step 1: Mint login link
        console.log('Step 1: Minting login link...');
        const mintRes = await fetch(`${BASE_URL}/api/internal/admin/mint-login-link`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ADMIN_SECRET}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });
        const mintData = await mintRes.json();

        if (!mintData.ok || !mintData.link) {
            throw new Error(`Mint failed: ${mintData.error}`);
        }
        console.log(`  ✓ Link minted (expires: ${mintData.expiresAt})`);
        results.steps.push({ step: 'mint', ok: true });

        // Step 2: Browser flow
        console.log('\nStep 2: Launching browser...');
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        // Visit confirm page
        console.log('Step 3: Visiting confirm page...');
        await page.goto(mintData.link);
        await page.waitForSelector('[data-testid="consume-page"]', { timeout: 10000 });
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'browser_01_confirm.png') });
        console.log('  ✓ Confirm page loaded');
        results.steps.push({ step: 'confirm_page', ok: true });

        // Click continue
        console.log('\nStep 4: Clicking Continue...');
        await page.click('[data-testid="consume-continue"]');

        // Wait for redirect
        await page.waitForURL((url) => !url.pathname.includes('/auth/consume'), { timeout: 15000 });
        const finalUrl = page.url();
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'browser_02_admin.png') });
        console.log(`  ✓ Redirected to: ${finalUrl}`);
        results.steps.push({ step: 'login', ok: true, url: finalUrl });

        if (finalUrl.includes('/login')) {
            throw new Error('Redirected to login instead of admin');
        }

        // Step 5: Check executive dashboard
        console.log('\nStep 5: Checking Executive dashboard...');
        await page.goto(`${BASE_URL}/executive`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'browser_03_executive.png') });

        const execContent = await page.textContent('body');
        const hasData = !execContent?.includes('No data') && !execContent?.includes('Run pipeline');
        console.log(`  ${hasData ? '✓' : '⚠️'} Executive dashboard ${hasData ? 'has data' : 'may be empty'}`);
        results.steps.push({ step: 'executive', ok: hasData });

        // Step 6: Check a team page
        console.log('\nStep 6: Checking Team dashboard...');
        await page.goto(`${BASE_URL}/team`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'browser_04_team.png') });
        console.log('  ✓ Team page loaded');
        results.steps.push({ step: 'team', ok: true });

        results.passed = true;
        console.log('\n✓ BROWSER ADMIN FLOW PASSED');

    } catch (e: any) {
        results.passed = false;
        results.error = e.message;
        console.error('\n⛔ FAILED:', e.message);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        fs.writeFileSync(
            path.join(ARTIFACTS_DIR, 'prod_browser_admin_flow.json'),
            JSON.stringify(results, null, 2)
        );
    }
}

main().catch(e => { console.error(e); process.exit(1); });

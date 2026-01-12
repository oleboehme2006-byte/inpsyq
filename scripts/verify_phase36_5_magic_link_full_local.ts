#!/usr/bin/env npx tsx
/**
 * PHASE 36.5 — Local Full E2E Magic Link Verification
 * 
 * Deterministic local test of the entire flow:
 * 1. Request link (API)
 * 2. Get link from test outbox (File)
 * 3. Visit link (Browser) -> Confirm Page
 * 4. Click Continue -> Login Success -> Redirect to Dashboard
 * 
 * Usage:
 *   EMAIL_PROVIDER=test AUTH_BASE_URL=http://localhost:3001 npx tsx scripts/verify_phase36_5_magic_link_full_local.ts
 */

import './_bootstrap';
import { chromium, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.AUTH_BASE_URL || 'http://localhost:3001';
const TEST_EMAIL = 'test-local-admin@inpsyq.com';
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase36_5');
const OUTBOX_FILE = path.join(process.cwd(), 'artifacts', 'email_outbox', 'last_magic_link.json');

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 36.5 — Local Full E2E Verification');
    console.log(`  Target: ${BASE_URL}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (process.env.EMAIL_PROVIDER !== 'test') {
        console.error('⛔ EMAIL_PROVIDER must be "test"');
        process.exit(1);
    }

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    let browser: Browser | null = null;
    try {
        // 1. Request Link
        console.log('Step 1: Requesting magic link...');
        if (fs.existsSync(OUTBOX_FILE)) fs.unlinkSync(OUTBOX_FILE);

        const res = await fetch(`${BASE_URL}/api/auth/request-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL }),
        });

        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        // Wait for file
        await new Promise(r => setTimeout(r, 500));
        if (!fs.existsSync(OUTBOX_FILE)) throw new Error('Outbox file not found');

        const outbox = JSON.parse(fs.readFileSync(OUTBOX_FILE, 'utf-8'));
        const link = outbox.extractedLink;
        console.log('  ✓ Link generated:', link);

        if (!link.includes('/auth/consume')) throw new Error('Link DOES NOT point to /auth/consume');

        // 2. Browser Flow
        console.log('\nStep 2: Browser Flow...');
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        // Visit Link (Scanner simulation - but we will click)
        await page.goto(link);
        await page.waitForSelector('[data-testid="consume-page"]');
        console.log('  ✓ Confirm page loaded');

        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'local_01_confirm.png') });

        // Click Continue
        console.log('Step 3: Clicking Continue...');
        await page.click('[data-testid="consume-continue"]');

        // Wait for redirect
        await page.waitForURL((url) => !url.pathname.includes('/auth/consume'), { timeout: 10000 });
        const finalUrl = page.url();
        console.log('  ✓ Redirected to:', finalUrl);

        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'local_02_logged_in.png') });

        if (finalUrl.includes('/login')) throw new Error('Redirected back to login (Session failed)');

        console.log('\n✓ LOCAL E2E PASSED');

    } catch (e: any) {
        console.error('\n⛔ FAILED:', e.message);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
    }
}

main().catch(e => { console.error(e); process.exit(1); });

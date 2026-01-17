#!/usr/bin/env npx tsx
/**
 * PHASE 25.4 — Landing & Demo E2E Test
 * 
 * Requires: Dev server running on port 3001
 */

import './_bootstrap';
import { chromium, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase25_4');

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    screenshot?: string;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 25.4 — Landing & Demo E2E');
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    const results: TestResult[] = [];
    let browser: Browser | null = null;

    try {
        console.log('Launching browser...');
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        // ─────────────────────────────────────────────────────────────────
        // Test 1: Landing page loads
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 1: Visit landing page...');
        try {
            await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
            await page.waitForSelector('[data-testid="landing-page"]', { timeout: 10000 });

            const s = path.join(ARTIFACTS_DIR, 'landing_page.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Landing page loads', passed: true, screenshot: s });
            console.log('  ✓ Landing page loaded\n');
        } catch (e: any) {
            results.push({ name: 'Landing page loads', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 2: Landing CTAs present
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 2: Check landing CTAs...');
        try {
            const loginCta = await page.$('[data-testid="landing-cta-login"]');
            const demoCta = await page.$('[data-testid="landing-cta-demo"]');

            if (loginCta && demoCta) {
                results.push({ name: 'Landing CTAs present', passed: true });
                console.log('  ✓ Both CTAs present\n');
            } else {
                results.push({ name: 'Landing CTAs present', passed: false, error: 'Missing CTAs' });
                console.log('  ✗ Missing CTAs\n');
            }
        } catch (e: any) {
            results.push({ name: 'Landing CTAs present', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 3: Click demo CTA
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 3: Click "View Demo" CTA...');
        try {
            await page.click('[data-testid="landing-cta-demo"]');
            await page.waitForURL('**/demo', { timeout: 10000 });
            await page.waitForSelector('[data-testid="demo-page"]', { timeout: 10000 });

            const s = path.join(ARTIFACTS_DIR, 'demo_page.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Navigate to demo', passed: true, screenshot: s });
            console.log('  ✓ Demo page loaded\n');
        } catch (e: any) {
            results.push({ name: 'Navigate to demo', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 4: Demo mode banner visible
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 4: Check DEMO MODE banner...');
        try {
            const banner = await page.$('[data-testid="demo-mode-banner"]');

            if (banner) {
                const text = await banner.textContent();
                if (text?.includes('DEMO MODE')) {
                    results.push({ name: 'Demo mode banner', passed: true });
                    console.log('  ✓ DEMO MODE banner visible\n');
                } else {
                    results.push({ name: 'Demo mode banner', passed: false, error: 'Banner text incorrect' });
                    console.log('  ✗ Banner text incorrect\n');
                }
            } else {
                results.push({ name: 'Demo mode banner', passed: false, error: 'Banner not found' });
                console.log('  ✗ Banner not found\n');
            }
        } catch (e: any) {
            results.push({ name: 'Demo mode banner', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

    } catch (e: any) {
        console.error('Critical error:', e.message);
        results.push({ name: 'Critical', passed: false, error: e.message });
    } finally {
        if (browser) await browser.close();
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');

    const passed = results.filter(r => r.passed).length;
    for (const r of results) {
        console.log(`  ${r.passed ? '✓' : '✗'} ${r.name}${r.error ? ` (${r.error})` : ''}`);
    }
    console.log(`\nTotal: ${passed}/${results.length} passed`);

    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'summary.json'),
        JSON.stringify({ timestamp: new Date().toISOString(), passed, failed: results.length - passed, results }, null, 2)
    );

    console.log(`\n✓ Artifacts saved to ${ARTIFACTS_DIR}/`);
    if (results.some(r => !r.passed)) process.exit(1);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

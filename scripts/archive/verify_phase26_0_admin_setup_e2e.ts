#!/usr/bin/env npx tsx
/**
 * PHASE 26.0 — Admin Setup E2E Test
 * 
 * Requires: Dev server running on port 3001
 */

import './_bootstrap';
import { chromium, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase26_0');

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    screenshot?: string;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 26.0 — Admin Setup Wizard E2E');
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    const results: TestResult[] = [];
    let browser: Browser | null = null;

    try {
        // Load fixtures
        const fixturesPath = path.join(process.cwd(), 'artifacts', 'phase24_3', 'fixtures.json');
        let fixtures: any = null;
        if (fs.existsSync(fixturesPath)) {
            fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));
        }

        const adminUserId = fixtures?.users?.ADMIN || 'test-admin-0004';
        const orgId = fixtures?.orgs?.ORG_A || 'test-org-a';

        console.log(`Admin: ${adminUserId}`);
        console.log(`Org: ${orgId}\n`);

        console.log('Launching browser...');
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();

        await context.addCookies([
            { name: 'inpsyq_dev_user', value: adminUserId, domain: 'localhost', path: '/' },
            { name: 'inpsyq_selected_org', value: orgId, domain: 'localhost', path: '/' },
        ]);

        const page = await context.newPage();

        // ─────────────────────────────────────────────────────────────────
        // Test 1: Navigate to /admin/setup
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 1: Navigate to /admin/setup...');
        try {
            await page.goto(`${BASE_URL}/admin/setup`, { waitUntil: 'networkidle' });
            await page.waitForSelector('[data-testid="admin-setup-page"]', { timeout: 10000 });

            const s = path.join(ARTIFACTS_DIR, 'setup_page.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Setup page loads', passed: true, screenshot: s });
            console.log('  ✓ Setup page loaded\n');
        } catch (e: any) {
            results.push({ name: 'Setup page loads', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 2: Check all step selectors
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 2: Check step selectors...');
        const stepSelectors = ['A', 'B', 'C', 'D', 'E'];
        for (const step of stepSelectors) {
            try {
                const el = await page.$(`[data-testid="setup-step-${step}"]`);
                if (el) {
                    results.push({ name: `Step ${step} present`, passed: true });
                    console.log(`  ✓ Step ${step} present`);
                } else {
                    results.push({ name: `Step ${step} present`, passed: false, error: 'Not found' });
                    console.log(`  ✗ Step ${step} not found`);
                }
            } catch (e: any) {
                results.push({ name: `Step ${step} present`, passed: false, error: e.message });
            }
        }
        console.log('');

        // ─────────────────────────────────────────────────────────────────
        // Test 3: Click refresh
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 3: Click Re-check button...');
        try {
            await page.click('[data-testid="setup-refresh"]');
            await page.waitForTimeout(2000);
            results.push({ name: 'Refresh button works', passed: true });
            console.log('  ✓ Refresh triggered\n');
        } catch (e: any) {
            results.push({ name: 'Refresh button works', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 4: Toggle dry-run and click run-weekly
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 4: Run weekly (dry-run)...');
        try {
            // Ensure dry-run is checked
            const dryRunCheckbox = await page.$('[data-testid="setup-run-weekly-dryrun-toggle"]');
            if (dryRunCheckbox) {
                const isChecked = await dryRunCheckbox.isChecked();
                if (!isChecked) {
                    await dryRunCheckbox.click();
                }
            }

            await page.click('[data-testid="setup-run-weekly"]');
            await page.waitForSelector('[data-testid="setup-run-weekly-result"]', { timeout: 30000 });

            const s = path.join(ARTIFACTS_DIR, 'setup_after_run.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Run weekly (dry-run)', passed: true, screenshot: s });
            console.log('  ✓ Weekly run completed\n');
        } catch (e: any) {
            results.push({ name: 'Run weekly (dry-run)', passed: false, error: e.message });
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

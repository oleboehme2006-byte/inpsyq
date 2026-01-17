#!/usr/bin/env npx tsx
/**
 * PHASE 25.2 — Admin Teams & Ops E2E Test
 * 
 * Requires: Dev server running on port 3001
 * Uses cookie-based ADMIN authentication
 */

import './_bootstrap';
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase25_2');

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    screenshot?: string;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 25.2 — Admin Teams & Ops E2E');
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    const results: TestResult[] = [];
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
        console.log('Launching browser...');
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();

        // Get fixture data
        const fixturesPath = path.join(process.cwd(), 'artifacts', 'phase24_3', 'fixtures.json');
        let fixtures: any = null;

        if (fs.existsSync(fixturesPath)) {
            fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));
        }

        const adminUserId = fixtures?.users?.ADMIN || 'test-admin-0004';
        const orgId = fixtures?.orgs?.ORG_A || 'test-org-a';

        await context.addCookies([
            { name: 'inpsyq_dev_user', value: adminUserId, domain: 'localhost', path: '/' },
            { name: 'inpsyq_selected_org', value: orgId, domain: 'localhost', path: '/' },
        ]);

        page = await context.newPage();
        console.log(`Admin: ${adminUserId}, Org: ${orgId}\n`);

        // ─────────────────────────────────────────────────────────────────
        // Test 1: Teams page
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 1: Navigate to /admin/teams...');
        try {
            await page.goto(`${BASE_URL}/admin/teams`, { waitUntil: 'networkidle' });
            await page.waitForSelector('[data-testid="admin-teams-page"]', { timeout: 10000 });

            const s = path.join(ARTIFACTS_DIR, 'teams_page.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Teams page loads', passed: true, screenshot: s });
            console.log('  ✓ Teams page loaded\n');
        } catch (e: any) {
            results.push({ name: 'Teams page loads', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 2: Create team
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 2: Create team...');
        const teamName = `Ops QA ${Date.now()}`;
        try {
            await page.fill('[data-testid="team-create-name"]', teamName);
            await page.click('[data-testid="team-create-submit"]');
            await page.waitForTimeout(2000);

            const s = path.join(ARTIFACTS_DIR, 'team_created.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Create team', passed: true, screenshot: s });
            console.log(`  ✓ Created team "${teamName}"\n`);
        } catch (e: any) {
            results.push({ name: 'Create team', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 3: Org health page
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 3: Navigate to /admin/org/health...');
        try {
            await page.goto(`${BASE_URL}/admin/org/health`, { waitUntil: 'networkidle' });
            await page.waitForSelector('[data-testid="admin-org-health-page"]', { timeout: 10000 });

            const weekEl = await page.$('[data-testid="target-week-start"]');
            const weekText = weekEl ? await weekEl.textContent() : null;

            const s = path.join(ARTIFACTS_DIR, 'health_page.png');
            await page.screenshot({ path: s, fullPage: true });

            results.push({ name: 'Org health page', passed: true, screenshot: s });
            console.log(`  ✓ Health page loaded (week: ${weekText})\n`);
        } catch (e: any) {
            results.push({ name: 'Org health page', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 4: Weekly runs page
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 4: Navigate to /admin/system/weekly...');
        try {
            await page.goto(`${BASE_URL}/admin/system/weekly`, { waitUntil: 'networkidle' });
            await page.waitForSelector('[data-testid="admin-weekly-page"]', { timeout: 10000 });

            const s = path.join(ARTIFACTS_DIR, 'weekly_page.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Weekly runs page', passed: true, screenshot: s });
            console.log('  ✓ Weekly runs page loaded\n');
        } catch (e: any) {
            results.push({ name: 'Weekly runs page', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 5: Alerts page
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 5: Navigate to /admin/system/alerts...');
        try {
            await page.goto(`${BASE_URL}/admin/system/alerts`, { waitUntil: 'networkidle' });
            await page.waitForSelector('[data-testid="admin-alerts-page"]', { timeout: 10000 });

            const s = path.join(ARTIFACTS_DIR, 'alerts_page.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Alerts page', passed: true, screenshot: s });
            console.log('  ✓ Alerts page loaded\n');
        } catch (e: any) {
            results.push({ name: 'Alerts page', passed: false, error: e.message });
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

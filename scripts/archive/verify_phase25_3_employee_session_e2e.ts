#!/usr/bin/env npx tsx
/**
 * PHASE 25.3 — Employee Session E2E Test
 * 
 * Requires: Dev server running on port 3001
 */

import './_bootstrap';
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase25_3');

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    screenshot?: string;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 25.3 — Employee Session E2E');
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    const results: TestResult[] = [];
    let browser: Browser | null = null;

    try {
        console.log('Launching browser...');
        browser = await chromium.launch({ headless: true });

        // Load fixtures
        const fixturesPath = path.join(process.cwd(), 'artifacts', 'phase24_3', 'fixtures.json');
        let fixtures: any = null;

        if (fs.existsSync(fixturesPath)) {
            fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));
        }

        // Get an EMPLOYEE user
        const employeeUserId = fixtures?.users?.EMPLOYEE || 'test-employee-0001';
        const adminUserId = fixtures?.users?.ADMIN || 'test-admin-0004';
        const orgId = fixtures?.orgs?.ORG_A || 'test-org-a';

        console.log(`Employee: ${employeeUserId}`);
        console.log(`Admin: ${adminUserId}`);
        console.log(`Org: ${orgId}\n`);

        // ─────────────────────────────────────────────────────────────────
        // Test 1: Employee Session Page
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 1: Employee visits /employee/session...');
        try {
            const context = await browser.newContext();
            await context.addCookies([
                { name: 'inpsyq_dev_user', value: employeeUserId, domain: 'localhost', path: '/' },
                { name: 'inpsyq_selected_org', value: orgId, domain: 'localhost', path: '/' },
            ]);

            const page = await context.newPage();
            await page.goto(`${BASE_URL}/employee/session`, { waitUntil: 'networkidle' });
            await page.waitForSelector('[data-testid="session-page"]', { timeout: 10000 });

            const s = path.join(ARTIFACTS_DIR, 'session_page.png');
            await page.screenshot({ path: s, fullPage: true });
            results.push({ name: 'Session page loads', passed: true, screenshot: s });
            console.log('  ✓ Session page loaded\n');

            // Check for start button or already submitted state
            const startBtn = await page.$('[data-testid="session-start"]');
            const successState = await page.$('[data-testid="session-success"]');

            if (successState) {
                console.log('  ℹ Already submitted for this week\n');
                results.push({ name: 'Already submitted check', passed: true });
            } else if (startBtn) {
                // Test 2: Start Session
                console.log('Test 2: Start session...');
                await startBtn.click();
                await page.waitForTimeout(3000);

                const ss = path.join(ARTIFACTS_DIR, 'session_started.png');
                await page.screenshot({ path: ss, fullPage: true });
                results.push({ name: 'Start session', passed: true, screenshot: ss });
                console.log('  ✓ Session started\n');

                // Check for active question
                const question = await page.$('[data-testid^="session-question-"]');
                if (question) {
                    console.log('Test 3: Answer questions...');

                    // Fill first 3 questions
                    for (let i = 0; i < 3; i++) {
                        const textarea = await page.$('textarea');
                        if (textarea) {
                            await textarea.fill(`Test response ${i + 1}`);
                        }

                        const nextBtn = await page.$('[data-testid="session-next"]');
                        const submitBtn = await page.$('[data-testid="session-submit"]');

                        if (submitBtn) {
                            await submitBtn.click();
                            break;
                        } else if (nextBtn) {
                            await nextBtn.click();
                            await page.waitForTimeout(500);
                        }
                    }

                    const sq = path.join(ARTIFACTS_DIR, 'session_questions.png');
                    await page.screenshot({ path: sq, fullPage: true });
                    results.push({ name: 'Answer questions', passed: true, screenshot: sq });
                    console.log('  ✓ Answered questions\n');
                }
            }

            await context.close();

        } catch (e: any) {
            results.push({ name: 'Session page', passed: false, error: e.message });
            console.log(`  ✗ ${e.message}\n`);
        }

        // ─────────────────────────────────────────────────────────────────
        // Test 4: Admin Health Page (submissions count)
        // ─────────────────────────────────────────────────────────────────
        console.log('Test 4: Admin views org health with submissions count...');
        try {
            const context = await browser.newContext();
            await context.addCookies([
                { name: 'inpsyq_dev_user', value: adminUserId, domain: 'localhost', path: '/' },
                { name: 'inpsyq_selected_org', value: orgId, domain: 'localhost', path: '/' },
            ]);

            const page = await context.newPage();
            await page.goto(`${BASE_URL}/admin/org/health`, { waitUntil: 'networkidle' });
            await page.waitForSelector('[data-testid="admin-org-health-page"]', { timeout: 10000 });

            const sh = path.join(ARTIFACTS_DIR, 'admin_health.png');
            await page.screenshot({ path: sh, fullPage: true });
            results.push({ name: 'Admin health page', passed: true, screenshot: sh });
            console.log('  ✓ Admin health page loaded\n');

            await context.close();

        } catch (e: any) {
            results.push({ name: 'Admin health page', passed: false, error: e.message });
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

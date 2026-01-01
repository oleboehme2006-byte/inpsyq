/**
 * VERIFY PHASE 22: SMOKE TEST (PROD-LIKE)
 * 
 * Runs smoke checks against a target URL (defaults to localhost:3001).
 * Can be used in CI/CD pipeline against staging/prod.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import dotenv from 'dotenv';

// Load envs
dotenv.config(); // .env
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local', override: true });
}

// Configuration
// Configuration
const BASE_URL = process.env.VERIFY_BASE_URL || process.env.PROD_URL || 'http://localhost:3001';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const IS_DEV = !process.env.PROD_URL; // Assume dev if no PROD_URL provided

async function main() {
    console.log(`--- VERIFY: SMOKE PROD-LIKE ---`);
    console.log(`Target: ${BASE_URL}`);
    console.log(`Mode: ${IS_DEV ? 'DEV (Local)' : 'PROD (Remote)'}`);

    if (!ADMIN_SECRET) {
        console.error('FATAL: INTERNAL_ADMIN_SECRET is required.');
        process.exit(1);
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();
    let passed = true;

    // Helper to validate JSON response
    const validateResponse = async (res: any, url: string) => {
        const contentType = res.headers()['content-type'] || '';
        const bodyBuffer = await res.body();
        const bodyText = bodyBuffer.toString();

        if (contentType.includes('text/html') || bodyText.trim().startsWith('<!DOCTYPE') || bodyText.trim().startsWith('<html')) {
            console.error(`FAIL: ${url} returned HTML (Expected JSON)`);
            console.error(`Status: ${res.status()}`);
            console.error(`Content-Type: ${contentType}`);
            console.error('Body snippet:', bodyText.substring(0, 300));
            return false;
        }
        return true;
    };

    try {
        // 1. Root Check (Public)
        console.log(`\n> GET /`);
        const rootRes = await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
        if (rootRes && rootRes.status() === 200) {
            console.log('PASS: Root loads (200)');
        } else {
            console.error(`FAIL: Root returned ${rootRes?.status()}`);
            passed = false;
        }

        // 2. Health Check (Ops)
        console.log(`\n> GET /api/internal/ops/health/global (Authorized)`);
        const healthRes = await page.request.get(`${BASE_URL}/api/internal/ops/health/global`, {
            headers: { 'x-internal-admin-secret': ADMIN_SECRET }
        });

        if (!await validateResponse(healthRes, '/api/internal/ops/health/global')) {
            passed = false;
        } else if (healthRes.status() === 200) {
            console.log('PASS: Health Check OK (200)');
        } else {
            console.log(`WARN: Health Check returned ${healthRes.status()}`);
            if (healthRes.status() === 500) {
                console.log('Body:', (await healthRes.body()).toString().substring(0, 500));
            }
            if (IS_DEV) passed = false;
        }

        // 3. Weekly Runner Protection
        console.log(`\n> POST /api/internal/run-weekly (Unauthorized)`);
        const runRes = await page.request.post(`${BASE_URL}/api/internal/run-weekly`);

        // Even unauthorized response should generally be JSON in our API, but Next.js sometimes returns text/plain for 401/405 default handlers if not custom.
        // But our requirements say Internal APIs must return JSON.
        // However, middleware 401s might be different. Let's check generally.
        // Actually, for this specific test, we just want to ensure it's protected.
        // If it returns HTML 404/500, that's bad.
        if (!await validateResponse(runRes, '/api/internal/run-weekly')) {
            passed = false;
        } else if (runRes.status() === 401 || runRes.status() === 403) {
            console.log(`PASS: Weekly Runner Protected (${runRes.status()})`);
        } else {
            if (runRes.status() === 404) {
                console.log('SKIP: Weekly Runner route not found (404)');
            } else {
                console.error(`FAIL: Weekly Runner returned ${runRes.status()} (Expected 401/403)`);
                passed = false;
            }
        }

        // 4. Executive Dashboard (Auth Logic)
        if (IS_DEV) {
            console.log(`\n> DEV: Testing Login & Dashboard Access`);
            const loginRes = await page.request.post(`${BASE_URL}/api/internal/dev/login`, {
                data: { user_id: '11111111-1111-4111-8111-111111111111' }
            });

            if (!await validateResponse(loginRes, '/api/internal/dev/login')) {
                passed = false;
            } else if (loginRes.status() === 200) {
                console.log('PASS: Dev Login successful');
                console.log('> Navigating to /executive?demo=true');
                try {
                    const execRes = await page.goto(`${BASE_URL}/executive?demo=true`, { waitUntil: 'networkidle' });
                    if (execRes && execRes.status() === 200) {
                        console.log('PASS: Executive Dashboard loads (200)');
                    } else {
                        console.error(`FAIL: Executive Dashboard returned ${execRes?.status() ?? 'null'}`);
                        passed = false;
                    }
                } catch (e: any) {
                    console.error('FAIL: Executive Navigation threw:', e.message);
                    passed = false;
                }
            } else {
                console.error('FAIL: Dev Login failed - skipping dashboard check');
                passed = false;
            }
        } else {
            console.log(`\n> PROD: Skipping Login (Dev-only endpoint)`);
        }

    } catch (e) {
        console.error('FATAL CLOUD SMOKE ERROR', e);
        passed = false;
    } finally {
        await browser.close();
    }

    if (!passed) process.exit(1);
}

main();

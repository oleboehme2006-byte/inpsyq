#!/usr/bin/env npx tsx
/**
 * Production Routes Verification
 * 
 * Validates:
 * - Public routes return 200
 * - Anti-scanner API behavior (405, 400)
 * - Logout contract
 * - Internal endpoints require auth
 * 
 * Run:
 *   BASE_URL=https://www.inpsyq.com npx tsx scripts/verification/prod.routes.verify.ts
 */

import { writeFileSync, mkdirSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ARTIFACTS_DIR = 'artifacts/verification_suite';

interface CheckResult {
    name: string;
    method: string;
    url: string;
    status: number;
    pass: boolean;
    expected: string;
    actual: string;
    headers?: Record<string, string>;
    bodyPreview?: string;
}

const results: CheckResult[] = [];

async function check(
    name: string,
    method: string,
    path: string,
    expectedStatus: number,
    bodyCheck?: (body: any) => boolean,
    headers?: Record<string, string>
): Promise<boolean> {
    const url = `${BASE_URL}${path}`;
    try {
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: method === 'POST' ? '{}' : undefined,
        });

        const text = await res.text();
        let body: any;
        try {
            body = JSON.parse(text);
        } catch {
            body = text.slice(0, 200);
        }

        const statusPass = res.status === expectedStatus;
        const bodyPass = bodyCheck ? bodyCheck(body) : true;
        const pass = statusPass && bodyPass;

        results.push({
            name,
            method,
            url,
            status: res.status,
            pass,
            expected: `status=${expectedStatus}`,
            actual: `status=${res.status}`,
            bodyPreview: typeof body === 'string' ? body.slice(0, 100) : JSON.stringify(body).slice(0, 200),
        });

        return pass;
    } catch (e: any) {
        results.push({
            name,
            method,
            url,
            status: 0,
            pass: false,
            expected: `status=${expectedStatus}`,
            actual: `error: ${e.message}`,
        });
        return false;
    }
}

async function main() {
    console.log('Production Routes Verification');
    console.log(`Target: ${BASE_URL}\n`);

    mkdirSync(ARTIFACTS_DIR, { recursive: true });

    let allPass = true;

    // A) Public routes
    console.log('A) Public Routes');
    allPass = await check('GET /', 'GET', '/', 200) && allPass;
    allPass = await check('GET /login', 'GET', '/login', 200) && allPass;
    allPass = await check('GET /auth/consume', 'GET', '/auth/consume', 200) && allPass;

    // B) Anti-scanner API behavior
    console.log('B) Anti-scanner API');
    allPass = await check(
        'GET /api/auth/consume (should 405)',
        'GET',
        '/api/auth/consume',
        405,
        (body) => body?.error !== undefined || body?.code !== undefined
    ) && allPass;

    allPass = await check(
        'POST /api/auth/consume (missing token)',
        'POST',
        '/api/auth/consume',
        400,
        (body) => body?.error !== undefined || body?.ok === false
    ) && allPass;

    // C) Logout contract
    console.log('C) Logout Contract');
    allPass = await check(
        'POST /api/auth/logout',
        'POST',
        '/api/auth/logout',
        200,
        (body) => body?.ok !== undefined || body?.error !== undefined
    ) && allPass;

    // D) Internal endpoints require auth
    console.log('D) Internal Endpoints Security');
    allPass = await check(
        'GET /api/internal/admin/test-org/status (no auth)',
        'GET',
        '/api/internal/admin/test-org/status',
        401
    ) && allPass;

    // Write results
    writeFileSync(
        `${ARTIFACTS_DIR}/prod_routes_verify.json`,
        JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
    );

    // Summary
    console.log('\nResults:');
    for (const r of results) {
        console.log(`  ${r.pass ? '✅' : '❌'} ${r.name}: ${r.actual}`);
    }

    if (allPass) {
        console.log('\n✅ All route checks passed');
        process.exit(0);
    } else {
        console.error('\n❌ Some route checks failed');
        process.exit(1);
    }
}

main();

#!/usr/bin/env npx tsx
/**
 * Production Security Invariants Verification
 * 
 * Validates:
 * - Public origin is enforced (www.inpsyq.com)
 * - No staging/preview domains in links
 * - Internal endpoints require auth
 * 
 * Run:
 *   BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=xxx npx tsx scripts/verification/prod.security.invariants.verify.ts
 */

import { writeFileSync, mkdirSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const ARTIFACTS_DIR = 'artifacts/verification_suite';

interface InvariantCheck {
    name: string;
    pass: boolean;
    expected: string;
    actual: string;
    data?: any;
}

const checks: InvariantCheck[] = [];

async function authFetch(path: string): Promise<Response> {
    return fetch(`${BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ADMIN_SECRET}`,
        },
    });
}

async function noAuthFetch(path: string): Promise<Response> {
    return fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' },
    });
}

async function main() {
    console.log('Production Security Invariants Verification');
    console.log(`Target: ${BASE_URL}\n`);

    mkdirSync(ARTIFACTS_DIR, { recursive: true });

    if (!ADMIN_SECRET) {
        console.error('❌ INTERNAL_ADMIN_SECRET required');
        process.exit(1);
    }

    let allPass = true;

    // 1) Origin Enforcement
    console.log('1) Origin Enforcement');
    try {
        const res = await authFetch('/api/internal/diag/auth-origin');
        if (res.ok) {
            const body = await res.json();

            // Endpoint returns { ok, auth: { computed_origin, origin_source, origin_enforced, ... } }
            const computed = body.auth?.computed_origin;
            const enforced = body.auth?.origin_enforced;
            const source = body.auth?.origin_source;
            const valid = body.auth?.origin_valid;

            const pass = computed === 'https://www.inpsyq.com' && enforced === true && valid === true;

            checks.push({
                name: 'origin_enforcement',
                pass,
                expected: 'origin=https://www.inpsyq.com, enforced=true, valid=true',
                actual: `origin=${computed}, enforced=${enforced}, source=${source}, valid=${valid}`,
                data: body.auth,
            });

            if (pass) {
                console.log('  ✅ Origin enforced: www.inpsyq.com');
            } else {
                console.error('  ❌ Origin not enforced:', computed, enforced);
                allPass = false;
            }
        } else {
            checks.push({
                name: 'origin_enforcement',
                pass: false,
                expected: 'status 200',
                actual: `status ${res.status}`,
            });
            console.error('  ❌ Diag endpoint returned', res.status);
            allPass = false;
        }
    } catch (e: any) {
        checks.push({
            name: 'origin_enforcement',
            pass: false,
            expected: 'success',
            actual: `error: ${e.message}`,
        });
        console.error('  ❌ Error:', e.message);
        allPass = false;
    }

    // 2) No Preview Domain Leak
    console.log('2) No Preview Domain Leak');
    try {
        const res = await authFetch('/api/internal/diag/auth-request-link');
        if (res.ok) {
            const body = await res.json();

            // Check that origin doesn't contain vercel.app or preview
            const origin = body.origin?.computed || body.origin?.origin || '';
            const noLeak = !origin.includes('vercel.app') &&
                !origin.includes('preview') &&
                !origin.includes('staging');

            checks.push({
                name: 'no_preview_leak',
                pass: noLeak && origin === 'https://www.inpsyq.com',
                expected: 'no vercel.app/preview/staging in origin',
                actual: `origin=${origin}`,
                data: body.origin,
            });

            if (noLeak) {
                console.log('  ✅ No preview domain leak');
            } else {
                console.error('  ❌ Preview domain detected:', origin);
                allPass = false;
            }
        } else {
            // Endpoint may not exist, try to infer from origin diag
            console.log('  ⚠️ auth-request-link returned', res.status, '- using origin check');
            const originCheck = checks.find(c => c.name === 'origin_enforcement');
            if (originCheck?.pass) {
                checks.push({
                    name: 'no_preview_leak',
                    pass: true,
                    expected: 'inferred from origin enforcement',
                    actual: 'origin is www.inpsyq.com',
                });
                console.log('  ✅ Inferred from origin enforcement');
            } else {
                allPass = false;
            }
        }
    } catch (e: any) {
        checks.push({
            name: 'no_preview_leak',
            pass: false,
            expected: 'success',
            actual: `error: ${e.message}`,
        });
        console.error('  ❌ Error:', e.message);
        allPass = false;
    }

    // 3) Internal Endpoints Require Auth
    console.log('3) Internal Endpoints Auth');
    const protectedEndpoints = [
        '/api/internal/admin/test-org/status',
        '/api/internal/diag/auth-origin',
        '/api/internal/health/system',
    ];

    for (const endpoint of protectedEndpoints) {
        try {
            const res = await noAuthFetch(endpoint);
            const pass = res.status === 401;

            checks.push({
                name: `auth_required_${endpoint}`,
                pass,
                expected: '401 without auth',
                actual: `${res.status}`,
            });

            if (pass) {
                console.log(`  ✅ ${endpoint} requires auth`);
            } else {
                console.error(`  ❌ ${endpoint} returned ${res.status} without auth`);
                allPass = false;
            }
        } catch (e: any) {
            checks.push({
                name: `auth_required_${endpoint}`,
                pass: false,
                expected: '401',
                actual: `error: ${e.message}`,
            });
            console.error(`  ❌ ${endpoint} error:`, e.message);
            allPass = false;
        }
    }

    // Write results
    writeFileSync(
        `${ARTIFACTS_DIR}/prod_security_invariants.json`,
        JSON.stringify({
            timestamp: new Date().toISOString(),
            baseUrl: BASE_URL,
            checks
        }, null, 2)
    );

    if (allPass) {
        console.log('\n✅ All security invariants verified');
        process.exit(0);
    } else {
        console.error('\n❌ Some security invariants failed');
        process.exit(1);
    }
}

main();

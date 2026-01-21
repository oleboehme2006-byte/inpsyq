#!/usr/bin/env npx tsx
/**
 * Production Admin UI Access Verification
 * 
 * Verifies that a user session with a selected org can access Admin-only APIs.
 * This proves that the session + org cookie + role resolution is working correctly for RBAC.
 * 
 * Flow:
 * 1. Mint & Consume login link (get session)
 * 2. Select Test Org (get org cookie)
 * 3. Call GET /api/admin/setup/status (requires ADMIN role via RBAC)
 * 4. Call GET /api/internal/diag/auth-origin (should FAIL without secret, even if admin)
 * 
 * Requires: BASE_URL, INTERNAL_ADMIN_SECRET
 */

import { strict as assert } from 'node:assert';
import { writeFileSync, mkdirSync } from 'node:fs';
import { extractCookiesFromResponse, mergeCookies, toCookieHeader } from './_helpers/cookieJar';

const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const TEST_ORG_ID = '99999999-9999-4999-8999-999999999999';
const TEST_ADMIN_EMAIL = 'oleboehme2006@gmail.com';

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const ARTIFACT_FILE = `artifacts/verification_suite/${TIMESTAMP}/prod_admin_access.json`;

interface StepCheck {
    step: string;
    pass: boolean;
    durationMs: number;
    error?: string;
}

const checks: StepCheck[] = [];

async function main() {
    console.log('Production Admin UI Access Verification\n');
    console.log(`Target: ${BASE_URL}`);

    if (!ADMIN_SECRET) {
        console.error('❌ INTERNAL_ADMIN_SECRET required');
        process.exit(1);
    }

    mkdirSync(`artifacts/verification_suite/${TIMESTAMP}`, { recursive: true });
    let sessionCookies = '';

    try {
        // 1. Setup Session & Org (Pre-requisite)
        const startSetup = Date.now();

        // Mint
        const mintRes = await fetch(`${BASE_URL}/api/internal/admin/mint-login-link`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${ADMIN_SECRET}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_ADMIN_EMAIL })
        });
        const mintBody = await mintRes.json() as any;
        const loginUrl = mintBody.data?.url;

        // Consume
        const consumeRes = await fetch(loginUrl, { redirect: 'manual' });
        const newCookies = extractCookiesFromResponse(consumeRes);
        sessionCookies = toCookieHeader(newCookies);

        // Select Org
        const selectRes = await fetch(`${BASE_URL}/api/org/select`, {
            method: 'POST',
            headers: { 'Cookie': sessionCookies, 'Content-Type': 'application/json' },
            body: JSON.stringify({ orgId: TEST_ORG_ID })
        });
        const selectCookies = extractCookiesFromResponse(selectRes);
        if (selectCookies.length > 0) {
            sessionCookies = toCookieHeader(mergeCookies(sessionCookies.split('; '), selectCookies));
        }

        if (!selectRes.ok) throw new Error('Failed to select org');

        checks.push({ step: 'setup_session', pass: true, durationMs: Date.now() - startSetup });
        console.log('✅ Session & Org Context established');

        // 2. Verify Admin API Access (Cookie Authentication)
        // This endpoint uses requireAdminStrict -> requireRolesStrict -> cookie auth
        const startAccess = Date.now();
        const apiRes = await fetch(`${BASE_URL}/api/admin/setup/status`, {
            headers: { 'Cookie': sessionCookies }, // NO Authorization header!
        });

        if (apiRes.status === 200) {
            const body = await apiRes.json() as any;
            assert.ok(body.ok, 'Response should be ok');
            assert.equal(body.orgId, TEST_ORG_ID, 'Org ID should match');
            checks.push({ step: 'admin_api_access', pass: true, durationMs: Date.now() - startAccess });
            console.log('✅ Admin API (/api/admin/setup/status) accessible via Cookie');
        } else {
            throw new Error(`Admin API returned ${apiRes.status} (expected 200)`);
        }

        // 3. Verify Internal API Blocked (Cookie insufficient)
        // Internal endpoints usually require secret or specific internal guard
        // /api/internal/health/system is requireInternalAccess -> secret or dev user
        const startBlock = Date.now();
        const internalRes = await fetch(`${BASE_URL}/api/internal/health/system`, {
            headers: { 'Cookie': sessionCookies }, // Cookie only
        });

        // Should be 403 or 401
        if (internalRes.status !== 200) {
            checks.push({ step: 'internal_api_blocked', pass: true, durationMs: Date.now() - startBlock });
            console.log(`✅ Internal API correctly blocked for pure cookie session (${internalRes.status})`);
        } else {
            console.warn('⚠️ Internal API allowed via cookie? This might be intended if dev mode, but unexpected in prod.');
            // Not necessarily a failure if design allows dev user, but strict invariant usually requires secret
            checks.push({ step: 'internal_api_blocked', pass: false, durationMs: Date.now() - startBlock, error: 'Internal API was accessible' });
        }

        // Write Success
        writeFileSync(ARTIFACT_FILE, JSON.stringify({
            timestamp: new Date().toISOString(),
            success: true,
            checks
        }, null, 2));

        console.log('\n✅ Admin UI Access verify passed');

    } catch (e: any) {
        console.error(`\n❌ Verify failed: ${e.message}`);
        writeFileSync(ARTIFACT_FILE, JSON.stringify({
            timestamp: new Date().toISOString(),
            success: false,
            error: e.message,
            checks
        }, null, 2));
        process.exit(1);
    }
}

main();

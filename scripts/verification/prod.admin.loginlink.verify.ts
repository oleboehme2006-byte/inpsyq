#!/usr/bin/env npx tsx
/**
 * Production Admin Login Link Verification
 * 
 * Validates:
 * - mint-login-link endpoint returns valid login URL (if exists)
 * - OR auth-request-link diag returns valid info
 * - URL uses correct origin (www.inpsyq.com)
 * - URL uses correct path (/auth/consume)
 * - Token is present and valid length
 * 
 * Run:
 *   BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=xxx npx tsx scripts/verification/prod.admin.loginlink.verify.ts
 */

import { writeFileSync, mkdirSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const OLE_EMAIL = 'oleboehme2006@gmail.com';
const ARTIFACTS_DIR = 'artifacts/verification_suite';

interface Result {
    method: string;
    pass: boolean;
    data?: any;
    error?: string;
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
    return fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ADMIN_SECRET}`,
            ...options.headers,
        },
    });
}

async function main() {
    console.log('Production Admin Login Link Verification');
    console.log(`Target: ${BASE_URL}\n`);

    mkdirSync(ARTIFACTS_DIR, { recursive: true });

    if (!ADMIN_SECRET) {
        console.error('❌ INTERNAL_ADMIN_SECRET required');
        process.exit(1);
    }

    const result: Result = { method: 'unknown', pass: false };

    // Try mint-login-link first
    console.log('Trying /api/internal/admin/mint-login-link...');
    try {
        const res = await authFetch('/api/internal/admin/mint-login-link', {
            method: 'POST',
            body: JSON.stringify({ email: OLE_EMAIL }),
        });

        if (res.status === 404) {
            console.log('  mint-login-link not found, trying diag endpoint...');

            // Try auth-request-link diag
            const diagRes = await authFetch('/api/internal/diag/auth-request-link');
            if (diagRes.status === 200) {
                const body = await diagRes.json();
                result.method = 'diag/auth-request-link';
                result.data = body;

                // Validate origin is correct
                const originOk = body.origin?.computed === 'https://www.inpsyq.com' ||
                    body.origin?.origin === 'https://www.inpsyq.com';
                const enforcedOk = body.origin?.enforced === true;

                result.pass = originOk && enforcedOk;

                if (result.pass) {
                    console.log('  ✅ Diag confirms origin is www.inpsyq.com and enforced');
                } else {
                    console.error('  ❌ Origin not correctly configured:', body.origin);
                }
            } else {
                result.method = 'none_available';
                result.error = 'No mint-login-link and diag returned ' + diagRes.status;
                console.error('  ❌ No safe endpoint available for login link verification');
            }
        } else {
            const body = await res.json();
            result.method = 'mint-login-link';
            result.data = { ok: body.ok, hasUrl: !!body.loginUrl };

            if (body.ok && body.loginUrl) {
                // Validate URL
                const url = new URL(body.loginUrl);
                const hostnameOk = url.hostname === 'www.inpsyq.com';
                const pathnameOk = url.pathname === '/auth/consume';
                const tokenParam = url.searchParams.get('token');
                const tokenOk = !!(tokenParam && tokenParam.length >= 20);

                result.pass = hostnameOk && pathnameOk && tokenOk;
                result.data.validation = {
                    hostname: url.hostname,
                    pathname: url.pathname,
                    tokenLength: tokenParam?.length,
                    hostnameOk,
                    pathnameOk,
                    tokenOk,
                };

                if (result.pass) {
                    console.log('  ✅ Login link valid:');
                    console.log('     hostname:', url.hostname);
                    console.log('     pathname:', url.pathname);
                    console.log('     token length:', tokenParam?.length);
                } else {
                    console.error('  ❌ Login link validation failed:', result.data.validation);
                }
            } else {
                result.pass = false;
                result.error = 'mint-login-link returned error: ' + JSON.stringify(body);
                console.error('  ❌ mint-login-link failed:', body);
            }
        }
    } catch (e: any) {
        result.error = e.message;
        console.error('  ❌ Error:', e.message);
    }

    // Write results
    writeFileSync(
        `${ARTIFACTS_DIR}/prod_admin_loginlink.json`,
        JSON.stringify({
            timestamp: new Date().toISOString(),
            baseUrl: BASE_URL,
            result
        }, null, 2)
    );

    if (result.pass) {
        console.log('\n✅ Login link verification passed');
        process.exit(0);
    } else {
        console.error('\n❌ Login link verification failed');
        process.exit(1);
    }
}

main();

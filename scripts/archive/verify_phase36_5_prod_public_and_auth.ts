#!/usr/bin/env npx tsx
/**
 * PHASE 36.5 — Production Public & Auth Verification
 * 
 * Verifies production endpoints configuration and basic reachability.
 * 
 * Usage:
 *   BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=... npx tsx scripts/verify_phase36_5_prod_public_and_auth.ts
 */

import './_bootstrap';

const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 36.5 — Production Public & Auth Check');
    console.log(`  Target: ${BASE_URL}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!ADMIN_SECRET) {
        console.error('⛔ INTERNAL_ADMIN_SECRET required');
        process.exit(1);
    }

    try {
        // 1. Check Public Routes
        console.log('Checking Routes:');

        // Landing
        const r1 = await fetch(`${BASE_URL}/`);
        console.log(`  /                  -> ${r1.status} ${r1.status === 200 ? 'OK' : 'FAIL'}`);

        // Auth Consume Page (should exist, maybe 200 if token missing handling renders page, or redirect)
        // Actually our code renders page with "Missing Token" if token missing, so should be 200.
        const r2 = await fetch(`${BASE_URL}/auth/consume`);
        console.log(`  /auth/consume      -> ${r2.status} ${r2.status === 200 ? 'OK' : 'FAIL'}`);

        // API Consume (GET should be 405)
        const r3 = await fetch(`${BASE_URL}/api/auth/consume`);
        console.log(`  /api/auth/consume  -> ${r3.status} ${r3.status === 405 ? 'OK' : 'FAIL'}`);
        if (r3.status !== 405) throw new Error('/api/auth/consume MUST return 405 for GET');

        // 2. Check Diagnostics
        console.log('\nChecking Diagnostics:');

        // Build
        const r4 = await fetch(`${BASE_URL}/api/internal/diag/build`, {
            headers: { Authorization: `Bearer ${ADMIN_SECRET}` }
        });
        const d4 = await r4.json();
        console.log('  /diag/build        ->', d4.ok ? 'OK' : 'FAIL');
        if (d4.ok) console.log(`                        Git: ${d4.build.git_sha} (${d4.build.git_ref})`);

        // Auth Origin
        const r5 = await fetch(`${BASE_URL}/api/internal/diag/auth-origin`, {
            headers: { Authorization: `Bearer ${ADMIN_SECRET}` }
        });
        const d5 = await r5.json();
        console.log('  /diag/auth-origin  ->', d5.ok ? 'OK' : 'FAIL');
        if (d5.ok) {
            console.log(`                        Origin: ${d5.auth.computed_origin}`);
            console.log(`                        Valid:  ${d5.auth.origin_valid}`);
            if (!d5.auth.origin_valid) throw new Error('Auth origin invalid!');
            if (d5.auth.computed_origin !== 'https://www.inpsyq.com') console.warn('⚠️ Origin is not https://www.inpsyq.com');
        }

        console.log('\n✓ PRODUCTION ROUTE CHECK PASSED');

    } catch (e: any) {
        console.error('\n⛔ FAILED:', e.message);
        process.exit(1);
    }
}

main().catch(e => { console.error(e); process.exit(1); });

#!/usr/bin/env npx tsx
/**
 * PHASE 36.5 — Check User Role
 * 
 * Verifies a specific user's role via internal diagnostic.
 * 
 * Usage:
 *   EMAIL=... BASE_URL=... INTERNAL_ADMIN_SECRET=... npx tsx scripts/verify_phase36_5_check_user_role.ts
 */

import './_bootstrap';

const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const EMAIL = process.env.EMAIL;

async function main() {
    if (!ADMIN_SECRET || !EMAIL) {
        console.error('⛔ INTERNAL_ADMIN_SECRET and EMAIL required');
        process.exit(1);
    }

    try {
        const res = await fetch(`${BASE_URL}/api/internal/diag/user-role?email=${encodeURIComponent(EMAIL)}`, {
            headers: { Authorization: `Bearer ${ADMIN_SECRET}` }
        });

        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));

        if (!data.found || !data.roles || data.roles.length === 0) {
            console.error('⛔ User not found or has no roles');
            process.exit(1);
        }

        const isAdmin = data.roles.some((r: any) => r.role === 'ADMIN');
        if (isAdmin) {
            console.log('\n✓ User has ADMIN role');
        } else {
            console.error('\n⛔ User does NOT have ADMIN role');
            process.exit(1);
        }

    } catch (e: any) {
        console.error(e);
        process.exit(1);
    }
}

main().catch(e => { console.error(e); process.exit(1); });

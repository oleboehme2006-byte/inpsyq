#!/usr/bin/env npx tsx
/**
 * PHASE 36.4 — Production Token Diagnostic
 * 
 * Checks the status of a login token without consuming it.
 * 
 * Usage:
 *   TOKEN=<paste-token> BASE_URL=https://www.inpsyq.com INTERNAL_ADMIN_SECRET=... \
 *     npx tsx scripts/verify_phase36_4_prod_token_diag.ts
 */

import './_bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://www.inpsyq.com';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const TOKEN = process.env.TOKEN;
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase36_4');

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 36.4 — Production Token Diagnostic');
    console.log(`  Target: ${BASE_URL}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!ADMIN_SECRET) {
        console.error('⛔ INTERNAL_ADMIN_SECRET not set');
        process.exit(1);
    }

    if (!TOKEN) {
        console.error('⛔ TOKEN not set');
        console.error('   Set TOKEN=<paste-token-from-email-link>');
        process.exit(1);
    }

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    console.log(`Token length: ${TOKEN.length}`);
    console.log(`Token preview: ${TOKEN.slice(0, 8)}...${TOKEN.slice(-4)}\n`);

    try {
        const res = await fetch(`${BASE_URL}/api/internal/diag/login-token?token=${encodeURIComponent(TOKEN)}`, {
            headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` },
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        console.log('Token Status:');
        console.log('─────────────────────────────────────────');
        console.log(`  Found:      ${data.found ? 'YES' : 'NO'}`);
        console.log(`  Status:     ${data.status}`);

        if (data.found) {
            console.log(`  Created:    ${data.createdAt}`);
            console.log(`  Expires:    ${data.expiresAt}`);
            console.log(`  Used At:    ${data.usedAt || 'NOT USED'}`);
            console.log(`  Now:        ${data.now}`);

            if (data.expiresInMs > 0) {
                console.log(`  Expires In: ${Math.round(data.expiresInMs / 1000)}s`);
            } else {
                console.log(`  Expired:    ${Math.abs(Math.round(data.expiresInMs / 1000))}s ago`);
            }
        }

        console.log(`  Hash:       ${data.tokenHashPrefix}`);

        // Interpretation
        console.log('\nInterpretation:');
        console.log('─────────────────────────────────────────');
        switch (data.status) {
            case 'OK':
                console.log('  ✓ Token is valid and unused - login should succeed');
                break;
            case 'USED':
                console.log('  ✗ Token has already been used');
                console.log('    This is expected if you (or a scanner) clicked the link');
                break;
            case 'EXPIRED':
                console.log('  ✗ Token has expired');
                console.log('    Request a new login link');
                break;
            case 'NOT_FOUND':
                console.log('  ✗ Token not found in database');
                console.log('    Possible causes: token corrupted, never created, or already deleted');
                break;
        }

        // Save artifact
        fs.writeFileSync(
            path.join(ARTIFACTS_DIR, 'token_diag.json'),
            JSON.stringify({
                timestamp: new Date().toISOString(),
                baseUrl: BASE_URL,
                tokenLength: TOKEN.length,
                result: data,
            }, null, 2)
        );

        console.log(`\n✓ Saved to ${ARTIFACTS_DIR}/token_diag.json`);

    } catch (e: any) {
        console.error(`✗ Diagnostic failed: ${e.message}`);
        process.exit(1);
    }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

#!/usr/bin/env npx tsx
/**
 * PHASE 36.6 — Build Guard
 * 
 * Ensures lib/auth/session.ts exports required functions.
 * Prevents build regressions.
 */

import './_bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase36_6');

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 36.6 — Build Guard');
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    const sessionModule = await import('@/lib/auth/session');

    const requiredExports = ['deleteSession', 'getSessionCookieName', 'createSession', 'getSession'];
    const exportedKeys = Object.keys(sessionModule);

    console.log('Exported keys:', exportedKeys);

    const sessionModuleRecord = sessionModule as Record<string, unknown>;

    let pass = true;
    for (const key of requiredExports) {
        const exists = typeof sessionModuleRecord[key] === 'function';
        console.log(`  ${key}: ${exists ? '✓' : '⛔ MISSING'}`);
        if (!exists) pass = false;
    }

    const result = {
        pass,
        exportedKeys,
        requiredExports,
        timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'build_guard.json'), JSON.stringify(result, null, 2));

    if (pass) {
        console.log('\n✓ BUILD GUARD PASSED');
    } else {
        console.error('\n⛔ BUILD GUARD FAILED');
        process.exit(1);
    }
}

main().catch(e => { console.error(e); process.exit(1); });

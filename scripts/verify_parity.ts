/**
 * Production Parity Verification Script
 * Compares local dev and production session behavior.
 * 
 * Usage: npm run verify:parity
 */

import './_bootstrap';
// Env loaded by bootstrap

interface Endpoint {
    name: string;
    url: string;
}

async function verifyParity() {
    console.log('=== Parity Verification ===\n');

    const devBase = process.env.APP_URL || 'http://localhost:3001';
    const prodUrl = 'https://www.inpsyq.com';

    const endpoints: Endpoint[] = [
        { name: 'IDs', url: '/api/internal/ids' },
        { name: 'Runtime', url: '/api/internal/runtime' },
    ];

    console.log('Comparing endpoints:\n');

    for (const ep of endpoints) {
        console.log(`--- ${ep.name} ---`);

        try {
            // Dev request
            const devStart = Date.now();
            const devRes = await fetch(`${devBase}${ep.url}`);
            const devMs = Date.now() - devStart;
            const devData = devRes.ok ? await devRes.json() : { error: devRes.status };

            console.log(`  Dev:  ${devRes.status} (${devMs}ms)`);

            // Prod request
            const prodStart = Date.now();
            const prodReqHeaders: Record<string, string> = {};
            if (process.env.INTERNAL_ADMIN_SECRET) {
                prodReqHeaders['x-inpsyq-admin-secret'] = process.env.INTERNAL_ADMIN_SECRET;
            }
            const prodRes = await fetch(`${prodUrl}${ep.url}`, { headers: prodReqHeaders });
            const prodMs = Date.now() - prodStart;
            const prodData = prodRes.ok ? await prodRes.json() : { error: prodRes.status };

            console.log(`  Prod: ${prodRes.status} (${prodMs}ms)`);

            // Compare key fields
            if (ep.name === 'Runtime' && devData.session && prodData.session) {
                const devSession = devData.session;
                const prodSession = prodData.session;

                console.log(`  targetCount: dev=${devSession.targetCount}, prod=${prodSession.targetCount}`);
                console.log(`  adaptive: dev=${devSession.adaptive}, prod=${prodSession.adaptive}`);
                console.log(`  forceCount: dev=${devSession.forceCount}, prod=${prodSession.forceCount}`);

                if (devSession.targetCount !== prodSession.targetCount) {
                    console.log(`  ⚠️  MISMATCH: targetCount differs!`);
                }
            }

            if (ep.name === 'IDs' && devData.counts && prodData.counts) {
                console.log(`  orgs: dev=${devData.counts.orgs}, prod=${prodData.counts.orgs}`);
                console.log(`  teams: dev=${devData.counts.teams}, prod=${prodData.counts.teams}`);
                console.log(`  users: dev=${devData.counts.users}, prod=${prodData.counts.users}`);
            }

        } catch (error: any) {
            console.log(`  ❌ Error: ${error.message}`);
        }

        console.log('');
    }

    console.log('=== Session Start Comparison ===\n');

    // Compare session/start
    try {
        const testUserId = process.env.TEST_USER_ID || '00000000-0000-0000-0000-000000000001';

        // Dev
        const devStart = Date.now();
        const devRes = await fetch(`${devBase}/api/session/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: testUserId }),
        });
        const devMs = Date.now() - devStart;
        const devSession = devRes.ok ? await devRes.json() : null;

        console.log(`Dev session/start: ${devRes.status} (${devMs}ms)`);
        if (devSession?.interactions) {
            console.log(`  interactions: ${devSession.interactions.length}`);
            console.log(`  meta.target_count: ${devSession.meta?.target_count}`);
            console.log(`  meta.actual_count: ${devSession.meta?.actual_count}`);
            console.log(`  meta.padded: ${devSession.meta?.padded}`);
        }

    } catch (error: any) {
        console.log(`  Dev Error: ${error.message}`);
    }

    console.log('\n=== Parity Check Complete ===');
    process.exit(0);
}

verifyParity();

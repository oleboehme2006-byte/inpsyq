/**
 * VERIFY PHASE 22: MOCK SAFETY
 *
 * Verifies that:
 * 1. Mocks are DISABLED in Production env, even if flag is ON.
 * 2. Mocks are ENABLED in Dev env if flag is ON.
 */

import { spawn } from 'child_process';
import path from 'path';

const WORKER_FLAG = 'VERIFY_WORKER';

if (process.env[WORKER_FLAG]) {
    // --- WORKER MODE ---
    // Import logic and print result
    import('../lib/dashboardClient').then(({ shouldUseMocks }) => {
        console.log(`SHOULD_USE_MOCKS=${shouldUseMocks()}`);
    });

} else {
    // --- ORCHESTRATOR MODE ---
    runTests();
}

async function runTests() {
    console.log('--- VERIFY: MOCK SAFETY ---');
    let passed = true;

    // Test 1: Production + Flag ON -> Should be OFF
    const prodResult = await runWorker('production', 'true');
    if (prodResult === 'SHOULD_USE_MOCKS=false') {
        console.log('PASS: Mocks disabled in Production (Flag=true)');
    } else {
        console.error(`FAIL: Mocks enabled in Production! Output: ${prodResult}`);
        passed = false;
    }

    // Test 2: Development + Flag ON -> Should be ON
    const devResult = await runWorker('development', 'true');
    if (devResult === 'SHOULD_USE_MOCKS=true') {
        console.log('PASS: Mocks enabled in Development (Flag=true)');
    } else {
        console.error(`FAIL: Mocks disabled in Development! Output: ${devResult}`);
        passed = false;
    }

    // Test 3: Development + Flag OFF -> Should be OFF
    const devOffResult = await runWorker('development', 'false');
    if (devOffResult === 'SHOULD_USE_MOCKS=false') {
        console.log('PASS: Mocks disabled in Development (Flag=false)');
    } else {
        console.error(`FAIL: Mocks enabled in Development (Flag=false)! Output: ${devOffResult}`);
        passed = false;
    }

    if (!passed) {
        process.exit(1);
    }
    console.log('\n✓ Mock Safety Verified');
}

function runWorker(nodeEnv: string, mockFlag: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const env = {
            ...process.env,
            NODE_ENV: nodeEnv,
            NEXT_PUBLIC_DASHBOARD_DEV_MOCKS: mockFlag,
            [WORKER_FLAG]: 'true'
        };

        const child = spawn('npx', ['tsx', __filename], { env: env as any, stdio: ['ignore', 'pipe', 'pipe'] });

        let stdout = '';
        child.stdout.on('data', d => stdout += d.toString());
        // child.stderr.on('data', d => console.error(d.toString())); // Debug if needed

        child.on('close', code => {
            if (code !== 0) reject(new Error(`Worker failed with code ${code}`));
            resolve(stdout.trim());
        });
    });
}

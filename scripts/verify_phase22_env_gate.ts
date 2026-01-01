/**
 * VERIFY PHASE 22: ENV GATE
 * 
 * Verifies that:
 * 1. Env validation passes when required vars are present.
 * 2. Env validation reports missing vars when they are absent.
 */

import { validateEnv } from '../lib/env/validate';

const ORCHESTRATOR_FLAG = 'VERIFY_ORCHESTRATOR';

if (process.env[ORCHESTRATOR_FLAG]) {
    // We are inside the orchestrator spawned process or just running directly?
    // Actually, simply importing `validateEnv` uses `process.env` of the current process.
    // So we can just set env vars and call it?
    // No, `process.env` might be cached or immutable if we try to delete keys sometimes (though usually delete works).
    // Safest is to spawn workers with modified env.
}

import { spawn } from 'child_process';

const WORKER_FLAG = 'VERIFY_WORKER';

if (process.env[WORKER_FLAG]) {
    runWorker();
} else {
    runOrchestrator();
}

function runWorker() {
    try {
        const result = validateEnv();
        console.log(JSON.stringify(result));
    } catch (e: any) {
        console.error(e.message);
        process.exit(1);
    }
}

async function runOrchestrator() {
    console.log('--- VERIFY: ENV GATE ---');
    let passed = true;

    // Test 1: Full Environment (Dev defaults)
    // We assume the current shell has valid env vars (from .env.local via dotenv/next dev)
    // Actually, running `npx tsx` loads .env automatically? 
    // `tsx` does NOT load .env by default I think, unless using `dotenv-cli` or similar.
    // But `next dev` does.
    // Let's manually inject a "perfect" env to verify SUCCESS case.
    const validEnv = {
        ...process.env,
        DATABASE_URL: 'postgres://valid',
        INTERNAL_ADMIN_SECRET: 'secret',
        INTERNAL_CRON_SECRET: 'secret',
        [WORKER_FLAG]: 'true'
    };

    const successOutput = await spawnWorker(validEnv);
    const successJson = JSON.parse(successOutput);
    if (successJson.ok) {
        console.log('PASS: Valid environment accepted');
    } else {
        console.error(`FAIL: Valid environment rejected: ${JSON.stringify(successJson)}`);
        passed = false;
    }

    // Test 2: Missing Admin Secret
    const invalidEnv = { ...validEnv };
    delete (invalidEnv as any).INTERNAL_ADMIN_SECRET;

    const failOutput = await spawnWorker(invalidEnv);
    const failJson = JSON.parse(failOutput);

    if (!failJson.ok && failJson.missing.includes('INTERNAL_ADMIN_SECRET')) {
        console.log('PASS: Missing Admin Secret detected');
    } else {
        console.error(`FAIL: Missing var not detected correctly: ${JSON.stringify(failJson)}`);
        passed = false;
    }

    if (!passed) process.exit(1);
    console.log('\n✓ Env Gate Verified');
}

function spawnWorker(env: any): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn('npx', ['tsx', __filename], { env, stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '';
        child.stdout.on('data', d => stdout += d.toString());
        child.on('close', code => {
            if (code !== 0) reject(new Error(`Worker failed code ${code}`));
            resolve(stdout.trim());
        });
    });
}

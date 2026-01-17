/**
 * VERIFY PHASE 22: DEV ROUTE SAFETY
 * 
 * Verifies that /api/internal/dev/login:
 * 1. Works in Development (mocked via standard npm run dev assumption)
 * 2. Returns 404 in Production simulation
 */

import { spawn } from 'child_process';
import { POST } from '@/app/api/internal/dev/login/route';
import { NextRequest } from 'next/server';

const WORKER_FLAG = 'VERIFY_WORKER';

if (process.env[WORKER_FLAG]) {
    runWorkerLogic();
} else {
    runOrchestrator();
}

async function runWorkerLogic() {
    // Mock NextRequest
    const req = new NextRequest('http://localhost:3001/api/internal/dev/login', {
        method: 'POST',
        body: JSON.stringify({ user_id: '11111111-1111-4111-8111-111111111111' })
    });

    try {
        const res = await POST(req);
        console.log(`STATUS=${res.status}`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

async function runOrchestrator() {
    console.log('--- VERIFY: DEV ROUTE SAFETY ---');
    let passed = true;

    // Test 1: Development Mode
    const devStatus = await spawnWorker('development');
    if (devStatus === 'STATUS=200') {
        console.log('PASS: Development mode access allowed (200 OK)');
    } else {
        // Only 404 is strictly bad. 400 is fine (validation error means route reached).
        // My mock request has valid UUID though.
        console.error(`FAIL: Development expected 200, got ${devStatus}`);
        passed = false;
    }

    // Test 2: Production Mode
    const prodStatus = await spawnWorker('production');
    if (prodStatus === 'STATUS=404') {
        console.log('PASS: Production mode returned 404');
    } else {
        console.error(`FAIL: Production expected 404, got ${prodStatus}`);
        passed = false;
    }

    if (!passed) process.exit(1);
    console.log('\n✓ Route Safety Verified');
}

function spawnWorker(nodeEnv: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const env = {
            ...process.env,
            NODE_ENV: nodeEnv,
            [WORKER_FLAG]: 'true'
        };
        const child = spawn('npx', ['tsx', __filename], { env: env as any, stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '';
        child.stdout.on('data', d => stdout += d.toString());
        child.on('close', code => {
            if (code !== 0) reject(new Error(`Worker failed code ${code}`));
            resolve(stdout.trim());
        });
    });
}

/**
 * PREFLIGHT PROD-LIKE
 * 
 * Deterministic build and verification runner.
 * 1. Kills 3000/3001
 * 2. Runs Build & Lint
 * 3. Starts Server with unique Instance ID
 * 4. Polls for readiness & Identity match
 * 5. Runs Smoke Test against that specific instance
 * 6. Shuts down server
 */

import { spawn, execSync, exec, ChildProcess } from 'child_process';
import crypto from 'crypto';
// Node 18+ has native fetch

const PORT = 3001;
const TARGET_URL = `http://localhost:${PORT}`;
const INSTANCE_ID = crypto.randomUUID();

// Helper to log with timestamp
function log(msg: string) {
    console.log(`[PREFLIGHT] ${new Date().toLocaleTimeString()} - ${msg}`);
}

function error(msg: string) {
    console.error(`\x1b[31m[PREFLIGHT ERROR] ${msg}\x1b[0m`);
}

async function runStep(name: string, fn: () => Promise<void> | void) {
    log(`STEP: ${name}`);
    try {
        await fn();
        log(`✓ ${name} Passed`);
    } catch (e: any) {
        error(`Step ${name} FAILED: ${e.message}`);
        process.exit(1);
    }
}

function killPort(port: number) {
    try {
        // lsof -t -i :PORT
        const pid = execSync(`lsof -t -i :${port} || true`).toString().trim();
        if (pid) {
            log(`Killing process ${pid} on port ${port}`);
            execSync(`kill -9 ${pid}`);
        }
    } catch (e) {
        // ignore
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  DETERMINISTIC PREFLIGHT RUNNER');
    console.log(`  Instance ID: ${INSTANCE_ID}`);
    console.log('═══════════════════════════════════════════════════════════════');

    // 1. Cleanup
    await runStep('Cleanup Ports', () => {
        killPort(3000);
        killPort(3001);
    });

    // 2. Build & Lint
    await runStep('Build', () => {
        execSync('npm run build', { stdio: 'inherit' });
    });

    await runStep('Lint', () => {
        execSync('npm run lint', { stdio: 'inherit' });
    });

    // 3. Start Server
    let serverProc: ChildProcess | undefined;
    await runStep('Start Server (Unique ID)', async () => {
        serverProc = spawn('npm', ['run', 'start', '--', '-p', `${PORT}`], {
            detached: false,
            env: { ...process.env, INPSYQ_PREFLIGHT_INSTANCE_ID: INSTANCE_ID }
        });

        if (!serverProc || !serverProc.pid) throw new Error('Failed to spawn server');

        // Dont pipe stdout/stderr to keep output clean, logs are captured in artifact if run via tool?
        // Or pipe to inherit to see startup logs? Let's pipe.
        serverProc.stdout?.pipe(process.stdout);
        serverProc.stderr?.pipe(process.stderr);

        log(`Server spawned with PID ${serverProc.pid}. Waiting for readiness...`);

        // Poll for readiness
        let attempts = 0;
        const maxAttempts = 30; // 60s approx (2s interval)
        while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 2000));
            try {
                const res = await fetch(`${TARGET_URL}/api/internal/runtime`);
                if (res.status === 200) {
                    const json = await res.json() as any;
                    if (json.instance_id === INSTANCE_ID) {
                        log('✓ Server Ready & Identity Verified');
                        return;
                    } else {
                        throw new Error(`Instance ID Mismatch. Expected ${INSTANCE_ID}, got ${json.instance_id}`);
                    }
                }
            } catch (e) {
                // ignore conn ref errors while starting
            }
            attempts++;
            if (attempts % 5 === 0) log(`Waiting... (${attempts}/${maxAttempts})`);
        }
        throw new Error('Server Timed Out');
    });

    // 4. Smoke Test
    try {
        await runStep('Smoke Test', () => {
            // Pass PROD_URL to force smoke script into PROD mode (skipping dev login)
            execSync(`VERIFY_BASE_URL=${TARGET_URL} PROD_URL=${TARGET_URL} npm run verify:phase22:smoke`, { stdio: 'inherit' });
        });
    } catch (e: any) {
        error('Smoke Test Failed');
        // We still proceed to cleanup
        try {
            if (typeof serverProc !== 'undefined') {
                if (serverProc.pid) process.kill(-serverProc.pid);
                serverProc.kill();
            }
            killPort(PORT);
        } catch { }
        process.exit(1);
    }

    // 5. Cleanup
    log('Shutting down server...');
    if (typeof serverProc !== 'undefined') {
        serverProc.kill();
        await new Promise(r => setTimeout(r, 2000)); // Grace
        killPort(PORT);
    }

    log('✓ PREFLIGHT COMPLETE (Safe & Deterministic)');
}

main();

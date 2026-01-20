#!/usr/bin/env npx tsx
/**
 * Run Full Verification Suite
 * 
 * Orchestrates all verification steps:
 * 1. Local integrity (origin, email, test-org)
 * 2. Prod public routes
 * 3. Prod admin checks (if secret provided)
 * 
 * Usage:
 *   npx tsx scripts/verification/run.all.ts
 *   INTERNAL_ADMIN_SECRET=... npx tsx scripts/verification/run.all.ts
 */

import { spawnSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';

const ARTIFACTS_DIR = 'artifacts/verification_suite';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const REPORT_FILE = `${ARTIFACTS_DIR}/${TIMESTAMP}/full_report.json`;

mkdirSync(`${ARTIFACTS_DIR}/${TIMESTAMP}`, { recursive: true });

interface StepResult {
    name: string;
    command: string;
    exitCode: number;
    durationMs: number;
    status: 'PASS' | 'FAIL' | 'SKIPPED';
}

const results: StepResult[] = [];

function loadLocalSecret(): string | undefined {
    try {
        if (existsSync('.env.local')) {
            const content = readFileSync('.env.local', 'utf-8');
            const match = content.match(/INTERNAL_ADMIN_SECRET=(.*)/);
            if (match) return match[1].trim();
        }
    } catch (e) { console.warn('Failed to read .env.local', e); }
    return undefined;
}

function runStep(name: string, command: string, env: Record<string, string> = {}): boolean {
    console.log(`\n🔹 Running ${name}...`);
    const start = Date.now();

    // Split command into cmd + args
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    const proc = spawnSync(cmd, args, {
        stdio: 'inherit',
        env: { ...process.env, ...env },
        shell: true
    });

    const duration = Date.now() - start;
    const passed = proc.status === 0;

    // Mask secret in logs
    let maskedCommand = command;
    if (env.INTERNAL_ADMIN_SECRET) {
        maskedCommand = command.replace(/INTERNAL_ADMIN_SECRET=[^ ]+/, 'INTERNAL_ADMIN_SECRET=***');
    }

    results.push({
        name,
        command: maskedCommand,
        exitCode: proc.status ?? -1,
        durationMs: duration,
        status: passed ? 'PASS' : 'FAIL',
    });

    if (passed) {
        console.log(`✅ ${name} PASSED in ${duration}ms`);
    } else {
        console.error(`❌ ${name} FAILED (exit code ${proc.status})`);
    }

    return passed;
}

function main() {
    console.log(`\n🚀 Starting Full Verification Suite\nTimestamp: ${TIMESTAMP}`);
    console.log(`Report: ${REPORT_FILE}\n`);

    const localSecret = loadLocalSecret();
    const prodSecret = process.env.INTERNAL_ADMIN_SECRET;

    // 1. Local Canonical
    let allGreen = true;
    // Force localhost for local checks
    const localEnv: Record<string, string> = { BASE_URL: 'http://localhost:3000' };
    if (localSecret) localEnv.INTERNAL_ADMIN_SECRET = localSecret;

    allGreen = runStep('Origin Verify', 'npx tsx scripts/verification/origin.verify.ts', localEnv) && allGreen;
    allGreen = runStep('Email Verify', 'npx tsx scripts/verification/email.verify.ts', localEnv) && allGreen;

    // Run test-org verification locally only if we found a local secret
    if (localSecret) {
        allGreen = runStep('Test Org Verify', 'npx tsx scripts/verification/test-org.verify.ts', localEnv) && allGreen;
    } else {
        console.log('⚠️  Skipping Local Test Org Verify (no local secret found)');
        results.push({ name: 'Test Org Verify', command: '(skipped)', exitCode: 0, durationMs: 0, status: 'SKIPPED' });
    }

    // 2. Prod Public
    allGreen = runStep('Prod Public Routes', 'BASE_URL=https://www.inpsyq.com npx tsx scripts/verification/prod.routes.verify.ts') && allGreen;

    // 3. Prod Admin
    if (prodSecret) {
        const prodEnv = { INTERNAL_ADMIN_SECRET: prodSecret, BASE_URL: 'https://www.inpsyq.com' };
        allGreen = runStep('Prod Security Invariants', 'npx tsx scripts/verification/prod.security.invariants.verify.ts', prodEnv) && allGreen;
        allGreen = runStep('Prod Login Link', 'npx tsx scripts/verification/prod.admin.loginlink.verify.ts', prodEnv) && allGreen;
        allGreen = runStep('Prod Test Org Flow', 'npx tsx scripts/verification/prod.testorg.flow.verify.ts', prodEnv) && allGreen;
        allGreen = runStep('Prod Org List', 'npx tsx scripts/verification/prod.orglist.verify.ts', prodEnv) && allGreen;
        allGreen = runStep('Prod Org Select UI', 'npx tsx scripts/verification/prod.orgselect.ui.verify.ts', prodEnv) && allGreen;
    } else {
        console.log('\n⚠️  Skipping Prod Admin checks (INTERNAL_ADMIN_SECRET not set)');
        results.push({ name: 'Prod Admin Checks', command: '(skipped)', exitCode: 0, durationMs: 0, status: 'SKIPPED' });
    }

    // Write Report
    writeFileSync(REPORT_FILE, JSON.stringify({
        timestamp: new Date().toISOString(),
        environment: {
            node: process.version,
            baseUrl: 'https://www.inpsyq.com',
            hasLocalSecret: !!localSecret,
            hasProdSecret: !!prodSecret
        },
        results
    }, null, 2));

    console.log(`\n📊 Report written to ${REPORT_FILE}`);

    if (allGreen) {
        console.log('\n✅ SUITE PASSED');
        process.exit(0);
    } else {
        console.log('\n❌ SUITE FAILED');
        process.exit(1);
    }
}

main();

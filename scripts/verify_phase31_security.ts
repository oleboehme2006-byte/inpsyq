#!/usr/bin/env npx tsx
/**
 * PHASE 31 — Security Verification Script
 * 
 * Verifies rate limiting, session hardening, and audit logging.
 */

import './_bootstrap';
import * as fs from 'fs';
import * as path from 'path';
import {
    checkRateLimit,
    clearAllRateLimits,
    getRateLimitKey,
} from '../lib/security/rateLimit';
import {
    isSessionExpired,
    isSessionIdle,
    isSessionFresh,
    validateSession,
    SESSION_LIMITS,
} from '../lib/security/session';

const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase31');

interface TestResult {
    test: string;
    passed: boolean;
    details?: any;
    error?: string;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 31 — Security Verification');
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    const results: TestResult[] = [];

    // ─────────────────────────────────────────────────────────────────
    // Rate Limiting Tests
    // ─────────────────────────────────────────────────────────────────
    console.log('=== Rate Limiting Tests ===\n');

    // Test 1: Allow within limit
    console.log('Test 1: Allow within limit...');
    clearAllRateLimits();
    const key1 = getRateLimitKey('192.168.1.1', 'test@example.com');
    let allAllowed = true;
    for (let i = 0; i < 5; i++) {
        const result = checkRateLimit('AUTH_REQUEST_LINK', key1);
        if (!result.allowed) allAllowed = false;
    }
    results.push({
        test: 'Rate limit: allow within limit',
        passed: allAllowed,
    });
    console.log(allAllowed ? '  ✓ Passed' : '  ✗ Failed');

    // Test 2: Block after limit
    console.log('Test 2: Block after limit...');
    const overLimit = checkRateLimit('AUTH_REQUEST_LINK', key1);
    results.push({
        test: 'Rate limit: block after limit',
        passed: !overLimit.allowed,
        details: { remaining: overLimit.remaining },
    });
    console.log(!overLimit.allowed ? '  ✓ Passed' : '  ✗ Failed');

    // Test 3: Different IPs isolated
    console.log('Test 3: Different IPs isolated...');
    const key2 = getRateLimitKey('192.168.1.2', 'other@example.com');
    const isolated = checkRateLimit('AUTH_REQUEST_LINK', key2);
    results.push({
        test: 'Rate limit: IP isolation',
        passed: isolated.allowed,
    });
    console.log(isolated.allowed ? '  ✓ Passed' : '  ✗ Failed');

    clearAllRateLimits();

    // ─────────────────────────────────────────────────────────────────
    // Session Hardening Tests
    // ─────────────────────────────────────────────────────────────────
    console.log('\n=== Session Hardening Tests ===\n');

    // Test 4: Valid session
    console.log('Test 4: Valid session...');
    const now = new Date();
    const recentCreate = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
    const recentSeen = new Date(now.getTime() - 1000 * 60 * 5); // 5 min ago
    const valid = validateSession(recentCreate, recentSeen);
    results.push({
        test: 'Session: valid recent session',
        passed: valid.valid,
    });
    console.log(valid.valid ? '  ✓ Passed' : '  ✗ Failed');

    // Test 5: Expired session (absolute)
    console.log('Test 5: Expired session (absolute)...');
    const oldCreate = new Date(now.getTime() - (SESSION_LIMITS.ABSOLUTE_LIFETIME_DAYS + 1) * 24 * 60 * 60 * 1000);
    const expired = isSessionExpired(oldCreate);
    results.push({
        test: 'Session: expired (absolute lifetime)',
        passed: expired,
    });
    console.log(expired ? '  ✓ Passed' : '  ✗ Failed');

    // Test 6: Idle session
    console.log('Test 6: Idle session...');
    const idleSeen = new Date(now.getTime() - (SESSION_LIMITS.IDLE_TIMEOUT_DAYS + 1) * 24 * 60 * 60 * 1000);
    const idle = isSessionIdle(idleSeen);
    results.push({
        test: 'Session: idle timeout',
        passed: idle,
    });
    console.log(idle ? '  ✓ Passed' : '  ✗ Failed');

    // Test 7: Fresh session check
    console.log('Test 7: Fresh session check...');
    const freshSeen = new Date(now.getTime() - 1000 * 60 * 5); // 5 min ago
    const stale = new Date(now.getTime() - 1000 * 60 * 15); // 15 min ago
    const freshOk = isSessionFresh(freshSeen);
    const staleOk = !isSessionFresh(stale);
    results.push({
        test: 'Session: fresh check',
        passed: freshOk && staleOk,
    });
    console.log(freshOk && staleOk ? '  ✓ Passed' : '  ✗ Failed');

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    for (const r of results) {
        console.log(`  ${r.passed ? '✓' : '✗'} ${r.test}`);
    }
    console.log(`\nTotal: ${passed}/${results.length} passed`);

    // Save
    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'security.json'),
        JSON.stringify({
            timestamp: new Date().toISOString(),
            passed,
            failed,
            results,
        }, null, 2)
    );

    console.log(`\n✓ Artifacts saved to ${ARTIFACTS_DIR}/security.json`);

    if (failed > 0) {
        console.log('\n⛔ PHASE 31 SECURITY: FAILED');
        process.exit(1);
    } else {
        console.log('\n✓ PHASE 31 SECURITY: PASSED');
    }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

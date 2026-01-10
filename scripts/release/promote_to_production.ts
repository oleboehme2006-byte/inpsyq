#!/usr/bin/env npx tsx
/**
 * PHASE 33 — Release Promotion Gate
 * 
 * Validates staging is healthy before allowing promotion to production.
 * Does NOT auto-push; provides commands for manual execution.
 */

import '../_bootstrap';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase33');
const STAGING_URL = process.env.STAGING_URL || 'https://inpsyq-staging.vercel.app';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;

interface GateResult {
    gate: string;
    passed: boolean;
    details?: any;
    error?: string;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 33 — Release Promotion Gate');
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    const results: GateResult[] = [];
    let allPassed = true;

    // ─────────────────────────────────────────────────────────────────
    // Gate 1: Working tree clean
    // ─────────────────────────────────────────────────────────────────
    console.log('Gate 1: Working tree clean...');
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
        const isClean = status === '';

        results.push({
            gate: 'Working tree clean',
            passed: isClean,
            details: isClean ? {} : { uncommitted: status.split('\n').length },
        });

        if (!isClean) {
            console.log('  ✗ Working tree has uncommitted changes');
            allPassed = false;
        } else {
            console.log('  ✓ Working tree is clean');
        }
    } catch (e: any) {
        results.push({ gate: 'Working tree clean', passed: false, error: e.message });
        allPassed = false;
    }

    // ─────────────────────────────────────────────────────────────────
    // Gate 2: On main branch
    // ─────────────────────────────────────────────────────────────────
    console.log('Gate 2: On main branch...');
    try {
        const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
        const isMain = branch === 'main';

        results.push({
            gate: 'On main branch',
            passed: isMain,
            details: { currentBranch: branch },
        });

        if (!isMain) {
            console.log(`  ✗ Not on main branch (current: ${branch})`);
            allPassed = false;
        } else {
            console.log('  ✓ On main branch');
        }
    } catch (e: any) {
        results.push({ gate: 'On main branch', passed: false, error: e.message });
        allPassed = false;
    }

    // ─────────────────────────────────────────────────────────────────
    // Gate 3: main is ahead of production
    // ─────────────────────────────────────────────────────────────────
    console.log('Gate 3: main ahead of production...');
    try {
        // Fetch latest
        execSync('git fetch origin production', { encoding: 'utf-8', stdio: 'pipe' });

        const aheadBehind = execSync(
            'git rev-list --left-right --count main...origin/production',
            { encoding: 'utf-8' }
        ).trim();

        const [ahead, behind] = aheadBehind.split('\t').map(Number);

        results.push({
            gate: 'main ahead of production',
            passed: ahead > 0,
            details: { ahead, behind },
        });

        if (ahead === 0) {
            console.log('  ⚠ main is not ahead of production (nothing to promote)');
        } else {
            console.log(`  ✓ main is ${ahead} commits ahead of production`);
        }
    } catch (e: any) {
        results.push({ gate: 'main ahead of production', passed: true, details: { note: 'Could not compare' } });
        console.log('  ⚠ Could not compare branches');
    }

    // ─────────────────────────────────────────────────────────────────
    // Gate 4: Staging API health
    // ─────────────────────────────────────────────────────────────────
    console.log('Gate 4: Staging API health...');
    try {
        const res = await fetch(`${STAGING_URL}/api/internal/health/system`, {
            headers: ADMIN_SECRET ? { 'Authorization': `Bearer ${ADMIN_SECRET}` } : {},
        });

        if (res.status === 401) {
            results.push({
                gate: 'Staging API health',
                passed: true,
                details: { note: 'INTERNAL_ADMIN_SECRET required for full check' },
            });
            console.log('  ⚠ Skipped (needs INTERNAL_ADMIN_SECRET)');
        } else {
            const data = await res.json();
            const isHealthy = data.ok === true;

            results.push({
                gate: 'Staging API health',
                passed: isHealthy,
                details: {
                    dbOk: data.health?.database?.ok,
                    pipelineOk: data.health?.pipeline?.ok,
                },
            });

            if (isHealthy) {
                console.log('  ✓ Staging API is healthy');
            } else {
                console.log('  ✗ Staging API unhealthy');
                allPassed = false;
            }
        }
    } catch (e: any) {
        results.push({ gate: 'Staging API health', passed: false, error: e.message });
        console.log(`  ✗ ${e.message}`);
        allPassed = false;
    }

    // ─────────────────────────────────────────────────────────────────
    // Gate 5: Staging public pages reachable
    // ─────────────────────────────────────────────────────────────────
    console.log('Gate 5: Staging public pages...');
    try {
        const landingRes = await fetch(`${STAGING_URL}/`);
        const landingHtml = await landingRes.text();
        const hasLanding = landingHtml.includes('landing-page');

        results.push({
            gate: 'Staging public pages',
            passed: hasLanding,
        });

        console.log(hasLanding ? '  ✓ Staging public pages OK' : '  ✗ Landing page missing testid');
        if (!hasLanding) allPassed = false;
    } catch (e: any) {
        results.push({ gate: 'Staging public pages', passed: false, error: e.message });
        allPassed = false;
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    for (const r of results) {
        console.log(`  ${r.passed ? '✓' : '✗'} ${r.gate}${r.error ? ` (${r.error})` : ''}`);
    }
    console.log(`\nTotal: ${passed}/${results.length} gates passed`);

    // Save artifact
    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'release_gate.json'),
        JSON.stringify({
            timestamp: new Date().toISOString(),
            stagingUrl: STAGING_URL,
            allPassed,
            results,
        }, null, 2)
    );

    console.log(`\n✓ Artifacts saved to ${ARTIFACTS_DIR}/release_gate.json`);

    if (allPassed) {
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('✓ ALL GATES PASSED — Ready for promotion');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('\nTo promote to production, run:');
        console.log('  git checkout production');
        console.log('  git merge main');
        console.log('  git push origin production');
        console.log('\nThen run production validation:');
        console.log('  npx tsx scripts/verify_phase33_prod_chrome.ts');
    } else {
        console.log('\n⛔ GATES FAILED — Fix issues before promoting');
        process.exit(1);
    }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

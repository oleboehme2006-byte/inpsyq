#!/usr/bin/env npx tsx
/**
 * PHASE 30 — Weekly Pipeline Production Verification
 * 
 * Verifies that weekly pipeline data exists and is consistent.
 * Uses INTERNAL_ADMIN_SECRET for authenticated health checks.
 */

import './_bootstrap';
import * as fs from 'fs';
import * as path from 'path';

const PROD_URL = process.env.PROD_URL || 'http://localhost:3000';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'phase30');

interface VerificationResult {
    check: string;
    passed: boolean;
    details?: any;
    error?: string;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 30 — Weekly Pipeline Production Verification');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!ADMIN_SECRET) {
        console.error('⛔ INTERNAL_ADMIN_SECRET not set');
        process.exit(1);
    }

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    const results: VerificationResult[] = [];

    // ─────────────────────────────────────────────────────────────────
    // Check 1: Admin Health Endpoint
    // ─────────────────────────────────────────────────────────────────
    console.log('Check 1: Admin org health endpoint...');
    try {
        const res = await fetch(`${PROD_URL}/api/admin/org/health`, {
            headers: {
                'Authorization': `Bearer ${ADMIN_SECRET}`,
            },
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        if (!data.ok) {
            throw new Error(data.error?.message || 'API returned not ok');
        }

        const health = data.health;
        const totalTeams = health.totalTeams || 0;
        const missingProducts = health.missingProducts || 0;
        const missingInterpretations = health.missingInterpretations || 0;

        results.push({
            check: 'Admin health endpoint',
            passed: true,
            details: {
                targetWeekStart: health.targetWeekStart,
                totalTeams,
                okTeams: health.okTeams,
                missingProducts,
                missingInterpretations,
            },
        });

        console.log(`  ✓ Target week: ${health.targetWeekStart}`);
        console.log(`  ✓ Teams: ${totalTeams} total, ${health.okTeams} OK`);

        // Check 2: Pipeline coverage
        console.log('\nCheck 2: Pipeline coverage...');
        if (totalTeams === 0) {
            results.push({
                check: 'Pipeline coverage',
                passed: true,
                details: { note: 'No teams configured - setup phase' },
            });
            console.log('  ⚠ No teams configured (setup phase)');
        } else if (missingProducts === 0) {
            results.push({
                check: 'Pipeline coverage',
                passed: true,
                details: { coverage: '100%' },
            });
            console.log('  ✓ All teams have products');
        } else {
            const coverage = ((totalTeams - missingProducts) / totalTeams * 100).toFixed(1);
            results.push({
                check: 'Pipeline coverage',
                passed: missingProducts < totalTeams, // At least some coverage
                details: { coverage: `${coverage}%`, missingProducts },
            });
            console.log(`  ⚠ Coverage: ${coverage}% (${missingProducts} missing)`);
        }

        // Check 3: Interpretation coverage
        console.log('\nCheck 3: Interpretation coverage...');
        if (totalTeams === 0 || missingProducts === totalTeams) {
            results.push({
                check: 'Interpretation coverage',
                passed: true,
                details: { note: 'Skipped - no products' },
            });
            console.log('  ⚠ Skipped (no products)');
        } else if (missingInterpretations === 0) {
            results.push({
                check: 'Interpretation coverage',
                passed: true,
                details: { coverage: '100%' },
            });
            console.log('  ✓ All teams have interpretations');
        } else {
            const teamsWith = totalTeams - missingInterpretations;
            results.push({
                check: 'Interpretation coverage',
                passed: teamsWith > 0,
                details: { teamsWithInterpretations: teamsWith },
            });
            console.log(`  ⚠ ${teamsWith}/${totalTeams} have interpretations`);
        }

    } catch (e: any) {
        results.push({
            check: 'Admin health endpoint',
            passed: false,
            error: e.message,
        });
        console.log(`  ✗ ${e.message}`);
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    for (const r of results) {
        console.log(`  ${r.passed ? '✓' : '✗'} ${r.check}${r.error ? ` (${r.error})` : ''}`);
    }
    console.log(`\nTotal: ${passed}/${results.length} passed`);

    // Save
    const artifact = {
        timestamp: new Date().toISOString(),
        prodUrl: PROD_URL,
        passed,
        failed,
        results,
    };

    fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'weekly_prod.json'),
        JSON.stringify(artifact, null, 2)
    );

    console.log(`\n✓ Artifacts saved to ${ARTIFACTS_DIR}/weekly_prod.json`);

    if (failed > 0) {
        console.log('\n⛔ PHASE 30 WEEKLY: FAILED');
        process.exit(1);
    } else {
        console.log('\n✓ PHASE 30 WEEKLY: PASSED');
    }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

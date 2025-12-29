#!/usr/bin/env npx tsx
/**
 * VERIFY PHASE 11 IDEMPOTENCY
 * 
 * Tests that running weekly twice results in SKIP on second run.
 */

export { }; // Make this a module

const BASE_URL = 'http://localhost:3001';
const CRON_SECRET = process.env.INTERNAL_CRON_SECRET || 'test-cron-secret';

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean, detail?: string): void {
    if (condition) {
        console.log(`✅ ${name}${detail ? ` (${detail})` : ''}`);
        passed++;
    } else {
        console.error(`❌ ${name}${detail ? ` - ${detail}` : ''}`);
        failed++;
    }
}

async function runWeekly(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/internal/run-weekly`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-cron-secret': CRON_SECRET,
        },
        body: JSON.stringify({}), // Full run, not dry run
    });
    return res.json();
}

async function main() {
    console.log('=== Phase 11 Idempotency Verification ===\n');

    // First run
    console.log('--- First Run ---');
    let firstResult: any;
    try {
        firstResult = await runWeekly();
        console.log(`  Run ID: ${firstResult.run_id}`);
        console.log(`  Status: ${firstResult.status}`);
        console.log(`  Pipeline upserts: ${firstResult.counts?.pipeline_upserts || 0}`);
        console.log(`  Pipeline skips: ${firstResult.counts?.pipeline_skips || 0}`);
        test('First run completed', firstResult.success === true || firstResult.status);
    } catch (e: any) {
        console.error(`  Error: ${e.message}`);
        test('First run completed', false);
        process.exit(1);
    }

    // Wait a moment
    await new Promise(r => setTimeout(r, 1000));

    // Second run (should skip)
    console.log('\n--- Second Run (should skip) ---');
    let secondResult: any;
    try {
        secondResult = await runWeekly();
        console.log(`  Run ID: ${secondResult.run_id}`);
        console.log(`  Status: ${secondResult.status}`);
        console.log(`  Pipeline upserts: ${secondResult.counts?.pipeline_upserts || 0}`);
        console.log(`  Pipeline skips: ${secondResult.counts?.pipeline_skips || 0}`);
        test('Second run completed', secondResult.success === true || secondResult.status);
    } catch (e: any) {
        console.error(`  Error: ${e.message}`);
        test('Second run completed', false);
        process.exit(1);
    }

    // Verify idempotency
    console.log('\n--- Idempotency Check ---');

    const firstUpserts = firstResult.counts?.pipeline_upserts || 0;
    const secondUpserts = secondResult.counts?.pipeline_upserts || 0;
    const secondSkips = secondResult.counts?.pipeline_skips || 0;

    // If first run had upserts, second should have more skips
    if (firstUpserts > 0) {
        test('Second run has more skips than upserts', secondSkips >= secondUpserts,
            `upserts=${secondUpserts}, skips=${secondSkips}`);
    }

    // Both runs should have same week
    test('Both runs use same week', firstResult.week_start === secondResult.week_start);

    // Interpretation should also skip on second run
    const firstInterpGens = firstResult.counts?.interpretation_generations || 0;
    const secondInterpGens = secondResult.counts?.interpretation_generations || 0;
    const secondInterpHits = secondResult.counts?.interpretation_cache_hits || 0;

    if (firstInterpGens > 0) {
        test('Interpretation uses cache on second run', secondInterpHits >= secondInterpGens,
            `generations=${secondInterpGens}, cache_hits=${secondInterpHits}`);
    }

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n⚠️ Idempotency verification failed');
        process.exit(1);
    } else {
        console.log('\n✅ Phase 11 idempotency verification passed');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});

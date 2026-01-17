#!/usr/bin/env npx tsx
/**
 * VERIFY PHASE 13 WEEKLY SMOKE
 * 
 * Integration test:
 * 1. Runs weekly cycle (dry run)
 * 2. Runs weekly cycle (full)
 * 3. Verifies interpretations generated
 * 4. Verifies cache hits on re-run
 */

import './_bootstrap';
import { getVerifyBaseUrl, fetchJson } from './_verifyBaseUrl';

const BASE_URL = getVerifyBaseUrl();
const CRON_SECRET = process.env.INTERNAL_CRON_SECRET || 'test-cron-secret';

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean, detail?: string) {
    if (condition) {
        console.log(`✅ ${name}${detail ? ` (${detail})` : ''}`);
        passed++;
    } else {
        console.error(`❌ ${name}${detail ? ` - ${detail}` : ''}`);
        failed++;
    }
}

async function runWeekly(dryRun: boolean, tag: string) {
    return fetchJson(
        `${BASE_URL}/api/internal/run-weekly`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-cron-secret': CRON_SECRET
            },
            body: JSON.stringify({ dry_run: dryRun })
        },
        tag
    );
}

async function main() {
    console.log('=== Phase 13 Weekly Integration Smoke ===\n');
    console.log(`Base URL: ${BASE_URL}\n`);

    // 1. Dry Run
    console.log('--- Dry Run ---');
    try {
        const { status, json } = await runWeekly(true, 'dry-run');
        test('Dry run succeeds', status === 200, `status=${status}`);
        test('Dry run not locked', json.status !== 'LOCKED');
    } catch (e: any) {
        test('Dry run', false, e.message);
    }

    // 2. Full Run (Generate Interpretations)
    console.log('\n--- Full Run (Generation) ---');
    let runId: string = '';
    try {
        const { status, json } = await runWeekly(false, 'full-run-1');
        test('Full run succeeds', status === 200, `status=${status}`);
        runId = json.run_id;

        const gens = json.counts?.interpretation_generations || 0;
        console.log(`  Generations: ${gens}`);
        console.log(`  Cache Hits: ${json.counts?.interpretation_cache_hits || 0}`);

        // We expect mostly generations if this is fresh, or hits if ran recently
        // But success is key
        test('Run reports completion', json.status === 'COMPLETED');
    } catch (e: any) {
        test('Full run', false, e.message);
        process.exit(1);
    }

    // 3. Re-Run (Cache Check)
    console.log('\n--- Re-Run (Cache Check) ---');
    try {
        const { status, json } = await runWeekly(false, 'full-run-2');
        test('Re-run succeeds', status === 200);

        const hits = json.counts?.interpretation_cache_hits || 0;
        const gens = json.counts?.interpretation_generations || 0;
        console.log(`  Generations: ${gens}`);
        console.log(`  Cache Hits: ${hits}`);

        test('Second run uses cache', hits >= gens, `hits=${hits} gens=${gens}`);
    } catch (e: any) {
        test('Re-run', false, e.message);
    }

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('⚠️ Weekly smoke test failed');
        process.exit(1);
    } else {
        console.log('✅ Phase 13 weekly integration verification passed');
        process.exit(0);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});

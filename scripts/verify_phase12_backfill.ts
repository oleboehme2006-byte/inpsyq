#!/usr/bin/env npx tsx
/**
 * VERIFY PHASE 12 BACKFILL
 * 
 * Tests that week_offset works for backfill scenarios.
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

async function runWeeklyWithOffset(weekOffset: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/internal/run-weekly`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-cron-secret': CRON_SECRET,
        },
        body: JSON.stringify({ week_offset: weekOffset, dry_run: true }),
    });
    return res.json();
}

async function main() {
    console.log('=== Phase 12 Backfill Verification ===\n');

    // Test 1: Current week (offset 0)
    console.log('--- Current Week (offset 0) ---');
    try {
        const result = await runWeeklyWithOffset(0);
        console.log(`  Week: ${result.week_start} (${result.week_label})`);
        test('Current week runs', result.success || result.run_id);
    } catch (e: any) {
        test('Current week', false, e.message);
    }

    // Test 2: Previous week (offset -1)
    console.log('\n--- Previous Week (offset -1) ---');
    try {
        const result = await runWeeklyWithOffset(-1);
        console.log(`  Week: ${result.week_start} (${result.week_label})`);
        test('Previous week runs', result.success || result.run_id);

        // Verify it's actually a different week
        const current = await runWeeklyWithOffset(0);
        test('Different from current', result.week_start !== current.week_start);
    } catch (e: any) {
        test('Previous week', false, e.message);
    }

    // Test 3: Two weeks ago (offset -2)
    console.log('\n--- Two Weeks Ago (offset -2) ---');
    try {
        const result = await runWeeklyWithOffset(-2);
        console.log(`  Week: ${result.week_start} (${result.week_label})`);
        test('Two weeks ago runs', result.success || result.run_id);
    } catch (e: any) {
        test('Two weeks ago', false, e.message);
    }

    // Summary
    console.log(`\n=== Summary ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n⚠️ Backfill verification failed');
        process.exit(1);
    } else {
        console.log('\n✅ Phase 12 backfill verification passed');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});

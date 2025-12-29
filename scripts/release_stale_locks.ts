
import './_bootstrap';
import { query } from '@/db/client';
import { runWeeklyRollup } from '@/services/pipeline/runner';

/**
 * Safe Lock Release Script
 * 
 * Replaces dangerous "DELETE FROM weekly_locks" with a verified release mechanism.
 * 
 * usage: npx tsx scripts/release_stale_locks.ts --dry-run
 * usage: npx tsx scripts/release_stale_locks.ts --confirm
 */

async function main() {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--confirm');

    console.log('--- Safe Lock Release ---');
    if (dryRun) console.log('DRY RUN (Use --confirm to execute)');

    // 1. Find Stale Locks (> 30 mins)
    // We use ACQUIRED status and time check.
    // Note: weekly_locks schema has `acquired_at`.
    const res = await query(`
        SELECT run_id, lock_key, acquired_at 
        FROM weekly_locks
        WHERE status = 'ACQUIRED'
          AND acquired_at < NOW() - INTERVAL '30 minutes'
    `);

    if (res.rows.length === 0) {
        console.log('No stale locks found.');
        return;
    }

    console.log(`Found ${res.rows.length} stale locks:`);
    res.rows.forEach(r => {
        console.log(`- [${r.lock_key}] Acquired: ${r.acquired_at} (RunID: ${r.run_id})`);
    });

    if (dryRun) {
        console.log('\nSkipping release in dry-run mode.');
        return;
    }

    const keys = res.rows.map(r => r.lock_key);

    for (const key of keys) {
        await query(`DELETE FROM weekly_locks WHERE lock_key = $1`, [key]);
        console.log(`Deleted lock: ${key}`);
    }

    console.log(`\nReleased ${keys.length} locks.`);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});

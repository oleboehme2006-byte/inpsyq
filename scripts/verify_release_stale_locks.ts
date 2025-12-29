
import './_bootstrap';
import { query } from '@/db/client';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';

async function verifyLockRelease() {
    console.log('--- Verifying Safe Lock Release ---\n');

    const lockKeyFresh = `test:fresh:${randomUUID()}`;
    const lockKeyStale = `test:stale:${randomUUID()}`;
    const runId = randomUUID();

    // 1. Insert Fresh Lock (Now)
    await query(`
        INSERT INTO weekly_locks (run_id, lock_key, acquired_at, expires_at, status)
        VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 hour', 'ACQUIRED')
    `, [runId, lockKeyFresh]);

    // 2. Insert Stale Lock (1 hour ago)
    await query(`
        INSERT INTO weekly_locks (run_id, lock_key, acquired_at, expires_at, status)
        VALUES ($1, $2, NOW() - INTERVAL '1 hour', NOW(), 'ACQUIRED')
    `, [runId, lockKeyStale]);

    console.log('Locks inserted. Running script...');

    // 3. Run Script (Confirm)
    try {
        const output = execSync('npx tsx scripts/release_stale_locks.ts --confirm', { encoding: 'utf-8' });
        console.log(output);
    } catch (e: any) {
        console.error('Script failed:', e.stdout);
        throw e;
    }

    // 4. Verify
    const resFresh = await query(`SELECT * FROM weekly_locks WHERE lock_key = $1`, [lockKeyFresh]);
    const resStale = await query(`SELECT * FROM weekly_locks WHERE lock_key = $1`, [lockKeyStale]);

    if (resFresh.rows.length !== 1) throw new Error('Fresh lock was incorrectly removed');
    if (resStale.rows.length !== 0) throw new Error('Stale lock was NOT removed');

    // Cleanup
    await query(`DELETE FROM weekly_locks WHERE lock_key = $1`, [lockKeyFresh]);

    console.log('✓ Verification Passed: Stale removed, Fresh kept.');
}

verifyLockRelease().catch(e => {
    console.error(e);
    process.exit(1);
});

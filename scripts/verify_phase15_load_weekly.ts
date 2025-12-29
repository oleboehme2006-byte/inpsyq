
import './_bootstrap';
import { query } from '@/db/client';
import { runWeeklyRollup } from '@/services/pipeline/runner';
import { randomUUID } from 'crypto';

async function loadTestWeeklyRunner() {
    console.log('--- Phase 15 Load Test: Weekly Runner (Locks) ---\n');

    // We want to verify that if we trigger the runner multiple times for the same team,
    // it handles locking correctly (or at least DB doesn't explode).
    // Note: The actual runner uses internal checks (idempotency via hash).

    const orgId = randomUUID();
    const teamId = randomUUID();
    const weekStartStr = '2023-01-08';
    const weekStartDate = new Date(weekStartStr);

    console.log(`Setup Data: Org=${orgId}, Team=${teamId}`);
    await query(`INSERT INTO orgs (org_id, name) VALUES ($1, $2)`, [orgId, 'LoadTestOrg']);
    await query(`INSERT INTO teams (team_id, org_id, name) VALUES ($1, $2, $3)`, [teamId, orgId, 'LoadTestTeam']);

    console.log('Firing 5 concurrent runs for SAME team...');

    const promises = [];
    for (let i = 0; i < 5; i++) {
        promises.push(
            runWeeklyRollup(orgId, teamId, weekStartDate)
                .then(res => ({ i, status: 'fulfilled', res }))
                .catch(e => ({ i, status: 'rejected', error: e.message }))
        );
    }

    const results = await Promise.all(promises);

    console.log('\nResults:');
    let successCount = 0;
    let skippedCount = 0;
    let failures = 0;

    results.forEach(r => {
        if (r.status === 'fulfilled') {
            // It might be "upserted: true" or "skipped: true"
            const success = r as { i: number; status: string; res: any };
            const reason = success.res.skipped ? `Skipped (${success.res.reason})` : 'Upserted';
            console.log(`Run ${r.i}: OK - ${reason}`);
            if (success.res.upserted) successCount++;
            if (success.res.skipped) skippedCount++;
        } else {
            const failure = r as { i: number; status: string; error: any };
            console.log(`Run ${r.i}: FAIL - ${failure.error}`);
            failures++;
        }
    });

    // In concurrent environment without advisory locks, multiple might try to upsert.
    // Hash check helps idempotency.
    // If they run exactly same time, ON CONFLICT handles it.
    // So we expect 1 success (possibly upserted or skipped if no data) and remaining interactions either skipped or ok.
    // Actually, "no_data" means skipped.

    console.log(`\nSuccess/Upserted: ${successCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Failures: ${failures}`);

    // Cleanup
    await query(`DELETE FROM org_aggregates_weekly WHERE org_id = $1`, [orgId]);
    await query(`DELETE FROM teams WHERE org_id = $1`, [orgId]);
    await query(`DELETE FROM orgs WHERE org_id = $1`, [orgId]);
}

loadTestWeeklyRunner().catch(e => {
    console.error(e);
    process.exit(1);
});

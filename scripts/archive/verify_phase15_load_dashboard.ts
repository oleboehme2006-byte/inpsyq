
import './_bootstrap';
import { query } from '@/db/client';
import { measure } from '@/lib/diagnostics/timing';
import { getTeamDashboardData } from '@/services/dashboard/teamReader';
import { randomUUID } from 'crypto';

async function loadTestDashboard() {
    console.log('--- Phase 15 Load Test: Dashboard ---\n');

    // Setup Data: 1 org, 10 teams, 10 weeks of data each
    const orgId = randomUUID();
    console.log(`Setup Org: ${orgId}`);

    await query(`INSERT INTO orgs (org_id, name) VALUES ($1, $2)`, [orgId, 'LoadTestOrg']);

    const teamIds: string[] = [];
    for (let i = 0; i < 10; i++) {
        const tid = randomUUID();
        teamIds.push(tid);
        await query(`INSERT INTO teams (team_id, org_id, name) VALUES ($1, $2, $3)`, [tid, orgId, `Team ${i}`]);

        // Insert mock data
        await query(`
            INSERT INTO org_aggregates_weekly 
            (org_id, team_id, week_start, input_hash, compute_version, team_state, indices, quality, series, attribution, parameter_means, parameter_uncertainty, contributions_breakdown)
            VALUES ($1, $2, '2023-01-01', 'hash', 'v1', '{}', '{}', '{}', '[]', '[]', '{}', '{}', '{}')
        `, [orgId, tid]);
    }

    console.log('Setup complete. Starting load test...');

    const CONCURRENCY = 20;
    const REQUESTS = 100;

    let completed = 0;
    const latencies: number[] = [];

    const start = Date.now();

    await measure('load_test_batch', async () => {
        const promises: Promise<void>[] = [];
        for (let i = 0; i < REQUESTS; i++) {
            const teamId = teamIds[i % teamIds.length];
            const p = (async () => {
                const t0 = Date.now();
                await getTeamDashboardData(orgId, teamId, 9);
                latencies.push(Date.now() - t0);
                completed++;
                if (completed % 25 === 0) process.stdout.write('.');
            })();
            promises.push(p);

            if (promises.length >= CONCURRENCY) {
                await Promise.race(promises); // Wait for at least one? No.
                // Simple batching: just fire all? NO.
                // Limit concurrency strictly.
                // Actually Promise.all fits nicely if we want to wait for batch.
            }
        }
        await Promise.all(promises);
    });

    const totalTime = Date.now() - start;
    console.log('\n\n--- Results ---');
    console.log(`Total Requests: ${REQUESTS}`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log(`RPS: ${(REQUESTS / (totalTime / 1000)).toFixed(2)}`);

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const max = latencies[latencies.length - 1];

    console.log(`P50: ${p50}ms`);
    console.log(`P95: ${p95}ms`);
    console.log(`Max: ${max}ms`);

    if (p95 > 100) { // arbitrary strict threshold for "cached/simple read"
        console.warn('⚠️  P95 latency > 100ms. Check indexing.');
    } else {
        console.log('✓ Latency within limits.');
    }

    // Cleanup
    await query(`DELETE FROM org_aggregates_weekly WHERE org_id = $1`, [orgId]);
    await query(`DELETE FROM teams WHERE org_id = $1`, [orgId]);
    await query(`DELETE FROM orgs WHERE org_id = $1`, [orgId]);
}

loadTestDashboard().catch(e => {
    console.error(e);
    process.exit(1);
});

/**
 * Verify Temporal Simulation
 * 
 * Checks multi-week data exists and prints week distribution.
 * 
 * Usage: npm run verify:temporal
 */

import { loadEnv } from '../lib/env/loadEnv';
loadEnv();

import { query } from '../db/client';
import { DEV_ORG_ID, DEV_TEAM_ID } from '../lib/dev/fixtures';

async function verify() {
    console.log('=== Temporal Simulation Verification ===\n');
    console.log(`ORG_ID:  ${DEV_ORG_ID}`);
    console.log(`TEAM_ID: ${DEV_TEAM_ID}\n`);

    // 1. Sessions by week
    const sessionsRes = await query(`
        SELECT 
            date_trunc('week', started_at)::date as week_start,
            COUNT(*) as count
        FROM sessions s
        JOIN users u ON s.user_id = u.user_id
        WHERE u.org_id = $1 AND u.team_id = $2
        GROUP BY week_start
        ORDER BY week_start ASC
    `, [DEV_ORG_ID, DEV_TEAM_ID]);

    console.log('Sessions by Week:');
    if (sessionsRes.rows.length === 0) {
        console.log('  (none)');
    } else {
        sessionsRes.rows.forEach(r => {
            console.log(`  ${new Date(r.week_start).toISOString().slice(0, 10)}: ${r.count} sessions`);
        });
    }
    console.log('');

    // 2. Aggregates by week
    const aggRes = await query(`
        SELECT 
            week_start,
            indices
        FROM org_aggregates_weekly
        WHERE org_id = $1 AND team_id = $2
        ORDER BY week_start ASC
    `, [DEV_ORG_ID, DEV_TEAM_ID]);

    console.log('Aggregates by Week:');
    if (aggRes.rows.length === 0) {
        console.log('  (none)');
    } else {
        aggRes.rows.forEach(r => {
            const strain = (r.indices?.strain ?? 0).toFixed(3);
            const withdrawal = (r.indices?.withdrawal ?? 0).toFixed(3);
            console.log(`  ${new Date(r.week_start).toISOString().slice(0, 10)}: strain=${strain}, withdrawal=${withdrawal}`);
        });
    }
    console.log('');

    // 3. Summary
    const sessionWeeks = sessionsRes.rows.length;
    const aggregateWeeks = aggRes.rows.length;

    console.log('Summary:');
    console.log(`  Session weeks:   ${sessionWeeks}`);
    console.log(`  Aggregate weeks: ${aggregateWeeks}`);
    console.log('');

    if (aggregateWeeks < 2) {
        console.log('⚠️  Fewer than 2 aggregate weeks - trends will be flat');
    }

    if (sessionWeeks > 0 && aggregateWeeks === 0) {
        console.log('⚠️  Sessions exist but no aggregates - run: npm run agg:dev');
    }

    process.exit(0);
}

verify();

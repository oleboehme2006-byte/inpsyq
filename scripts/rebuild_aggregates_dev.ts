/**
 * Multi-Week Aggregate Rebuild (Dev-Only)
 * 
 * Computes employee profiles and org aggregates for ALL weeks with session data.
 * This populates org_aggregates_weekly so dashboards show range_weeks > 0.
 * 
 * Usage: npm run agg:dev
 */

import { loadEnv } from '../lib/env/loadEnv';
loadEnv();

import { query } from '../db/client';
import { DEV_ORG_ID, DEV_TEAM_ID, getUsersForTeam } from '../lib/dev/fixtures';
import { profileService } from '../services/profileService';
import { aggregationService } from '../services/aggregationService';

// Guard: Dev only
if (process.env.NODE_ENV === 'production') {
    console.error('❌ agg:dev is DEV-ONLY. Refusing to run in production.');
    process.exit(1);
}

/**
 * Get Monday of a week from any date.
 */
function getWeekMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    d.setUTCDate(diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

async function rebuildAggregates() {
    console.log('=== Multi-Week Aggregate Rebuild ===\n');
    console.log(`ORG_ID:  ${DEV_ORG_ID}`);
    console.log(`TEAM_ID: ${DEV_TEAM_ID}\n`);

    // 1. Discover distinct weeks from sessions
    const weeksRes = await query(`
        SELECT DISTINCT date_trunc('week', started_at)::date as week_start
        FROM sessions s
        JOIN users u ON s.user_id = u.user_id
        WHERE u.org_id = $1 AND u.team_id = $2
        ORDER BY week_start ASC
    `, [DEV_ORG_ID, DEV_TEAM_ID]);

    const weekStarts = weeksRes.rows.map(r => getWeekMonday(new Date(r.week_start)));

    if (weekStarts.length === 0) {
        console.error('No sessions found. Run: npm run sim:dev');
        process.exit(1);
    }

    console.log(`Found ${weekStarts.length} weeks with session data:\n`);
    weekStarts.forEach((d, i) => console.log(`  ${i + 1}. ${d.toISOString().slice(0, 10)}`));
    console.log('');

    const teamUsers = getUsersForTeam(DEV_TEAM_ID);
    let totalProfiles = 0;
    let totalAggregates = 0;

    // 2. Process each week
    for (let i = 0; i < weekStarts.length; i++) {
        const weekStart = weekStarts[i];
        const weekStr = weekStart.toISOString().slice(0, 10);
        process.stdout.write(`Week ${i + 1}/${weekStarts.length} (${weekStr}): `);

        // 2a. Build employee profiles for each user
        let profilesThisWeek = 0;
        for (const user of teamUsers) {
            try {
                await profileService.computeEmployeeProfile(user.id, weekStart);
                profilesThisWeek++;
            } catch {
                // Non-fatal
            }
        }
        totalProfiles += profilesThisWeek;

        // 2b. Run weekly aggregation
        try {
            await aggregationService.runWeeklyAggregation(DEV_ORG_ID, DEV_TEAM_ID, weekStart);
            totalAggregates++;
            console.log(`${profilesThisWeek} profiles, aggregated ✓`);
        } catch (err: any) {
            console.log(`${profilesThisWeek} profiles, skip (${err.message})`);
        }
    }

    // 3. Verify
    const aggRes = await query(`
        SELECT COUNT(*) as count, MIN(week_start) as earliest, MAX(week_start) as latest
        FROM org_aggregates_weekly
        WHERE org_id = $1 AND team_id = $2
    `, [DEV_ORG_ID, DEV_TEAM_ID]);

    const aggCount = parseInt(aggRes.rows[0]?.count || '0');
    const earliest = aggRes.rows[0]?.earliest;
    const latest = aggRes.rows[0]?.latest;

    console.log('\n=== Results ===\n');
    console.log(`  employee_profiles built: ${totalProfiles}`);
    console.log(`  org_aggregates_weekly:   ${aggCount} weeks`);
    if (earliest && latest) {
        console.log(`  range: ${new Date(earliest).toISOString().slice(0, 10)} to ${new Date(latest).toISOString().slice(0, 10)}`);
    }
    console.log('');

    if (aggCount === 0) {
        console.log('⚠️  No aggregates created. Check if k_threshold is too high.');
        console.log('    Need ≥7 employee profiles per week. Increase users in sim:dev.');
        process.exit(1);
    }

    if (aggCount < 3) {
        console.log('⚠️  Only ' + aggCount + ' aggregate week(s). Trends may be flat.');
    }

    console.log('Verify dashboard:');
    console.log(`  curl -s "http://localhost:3001/api/admin/team-dashboard?org_id=${DEV_ORG_ID}&team_id=${DEV_TEAM_ID}" | jq '.meta.range_weeks, .indices'`);

    process.exit(0);
}

rebuildAggregates().catch(err => {
    console.error('Rebuild failed:', err);
    process.exit(1);
});

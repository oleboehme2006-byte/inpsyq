
import { syntheticDataGenerator } from '../mock/syntheticDataGenerator';
import { query, pool } from '../db/client';


async function main() {
    console.log('Fetching Existing IDs...');
    const idRes = await query(`SELECT org_id, team_id FROM org_aggregates_weekly LIMIT 1`);

    let orgId, teamId;

    if (idRes.rows.length === 0) {
        console.log("No data found. Attempting seed...");
        // Only seed if absolutely necessary, but handle the generic delete issue by skipping explicit delete if truncate works? 
        // For now, let's just abort if empty and ask to run api/init manually if needed.
        // Actually, let's try to just use the generator if empty.
        const genIds = await syntheticDataGenerator.generate();
        orgId = genIds.orgId;
        teamId = genIds.teamAId;
    } else {
        orgId = idRes.rows[0].org_id;
        teamId = idRes.rows[0].team_id;
    }

    console.log('Using IDs:', { orgId, teamId });

    console.log('fetching raw db rows...');

    // 1. Weekly Aggregates
    console.log('\n========= RAW PAYLOAD: WEEKLY AGGREGATES =========');
    const weekly = await query(`SELECT * FROM org_aggregates_weekly WHERE org_id = $1 AND team_id = $2 ORDER BY week_start ASC`, [orgId, teamId]);
    console.log(JSON.stringify(weekly.rows, null, 2));

    // 2. Profiles 
    console.log('\n========= RAW PAYLOAD: PROFILES =========');
    const profiles = await query(`SELECT * FROM org_profiles_weekly WHERE org_id = $1 AND team_id = $2 ORDER BY week_start DESC`, [orgId, teamId]);
    console.log(JSON.stringify(profiles.rows, null, 2));

    // 3. Audit for 3rd week
    if (weekly.rows.length > 0) {
        const weekStart = weekly.rows[weekly.rows.length - 1].week_start; // Pick LAST week
        console.log(`\n========= RAW PAYLOAD: AUDIT (${weekStart}) =========`);
        // We simulate what the API returns: partial subset
        const d = weekly.rows[weekly.rows.length - 1];

        const payload = {
            org_id: d.org_id,
            team_id: d.team_id,
            week_start: d.week_start,
            team_parameter_means: d.parameter_means,
            indices: d.indices,
            profile_weight_share: d.contributions_breakdown?.profile_weight_share,
            parameter_contributions: d.contributions_breakdown?.parameter_contributions
        };

        console.log(JSON.stringify(payload, null, 2));
    } else {
        console.log('Not enough weeks generated for Audit check.');
    }

    // FORCE EXIT to close pool
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});

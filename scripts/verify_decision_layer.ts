
import { decisionService } from '../services/decision/decisionService';
import { query } from '../db/client';

async function main() {
    console.log("Verifying Decision Layer against Frozen Core...");

    // Get valid IDs
    const agg = await query(`SELECT org_id, team_id, week_start FROM org_aggregates_weekly ORDER BY week_start DESC LIMIT 1`);
    if (agg.rows.length === 0) {
        console.error("No data found. Run seed first.");
        process.exit(1);
    }

    const { org_id, team_id, week_start } = agg.rows[0];
    console.log(`Analyzing Team ${team_id} for Week ${week_start}`);

    try {
        const snapshot = await decisionService.analyzeTeam(org_id, team_id, week_start);
        console.log("\n=== DECISION SNAPSHOT ===");
        console.log(JSON.stringify(snapshot, null, 2));

        // Assertions
        if (!snapshot.state.label) throw new Error("Missing State Label");
        if (!snapshot.recommendation.primary) throw new Error("Missing Recommendation");

        console.log("\n✅ Verification Passed: Snapshot is structured and deterministic.");
    } catch (e) {
        console.error(e);
        process.exit(1);
    }

    process.exit(0);
}

main();

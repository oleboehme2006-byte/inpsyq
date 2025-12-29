
import './_bootstrap';
import { query } from '@/db/client';
import { getOrgHealthSnapshot, getGlobalHealthSnapshot } from '@/services/ops/healthSnapshot';
import { randomUUID } from 'crypto';

async function verifyHealthSnapshot() {
    console.log('--- Verifying Health Snapshot ---\n');

    const orgId = randomUUID();
    const teamId = randomUUID();

    // Setup: Create Org/Team
    await query(`INSERT INTO orgs (org_id, name) VALUES ($1, $2)`, [orgId, 'HealthTestOrg']);
    await query(`INSERT INTO teams (team_id, org_id, name) VALUES ($1, $2, $3)`, [teamId, orgId, 'HealthTestTeam']);

    // 1. Check Empty State
    const s1 = await getOrgHealthSnapshot(orgId);
    console.log('S1 (Empty):', s1.teamsTotal, s1.missingProducts);
    if (s1.teamsTotal !== 1 || s1.missingProducts !== 1) throw new Error('Empty state mismatch');

    // 2. Add Product
    // We need to use "current week" for getOrgHealthSnapshot logic (offset 0)
    // The snapshot logic derives targetWeek from Date.now()
    // We need to match that.
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - (targetDate.getDay() + 6) % 7); // Previous Monday?
    // Wait, getISOMondayUTC logic:
    // const day = date.getUTCDay();
    // const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
    // It finds nearest Monday.
    // If today is Monday, it is today. 
    // Snapshots logic: weekStartISO(getISOMondayUTC(targetDate)).

    const weekStart = s1.weekStart; // Use what snapshot calculated
    console.log('Target Week:', weekStart);

    await query(`
        INSERT INTO org_aggregates_weekly (org_id, team_id, week_start, input_hash, compute_version, team_state, indices, quality, series, attribution)
        VALUES ($1, $2, $3, 'hash', 'v1', '{}', '{}', '{}', '[]', '[]')
    `, [orgId, teamId, weekStart]);

    const s2 = await getOrgHealthSnapshot(orgId);
    console.log('S2 (Product):', s2.teamsWithProducts, s2.teamsDegraded, s2.missingInterpretations);
    if (s2.teamsWithProducts !== 1) throw new Error('Product not detected');
    if (s2.teamsDegraded !== 1) throw new Error('Should be degraded (missing terp)');

    // 3. Add Interpretation
    await query(`
        INSERT INTO weekly_interpretations (org_id, team_id, week_start, input_hash, model_id, prompt_version, sections_json, is_active)
        VALUES ($1, $2, $3, 'hash', 'model', 'v1', '{}', true)
    `, [orgId, teamId, weekStart]);

    const s3 = await getOrgHealthSnapshot(orgId);
    console.log('S3 (Interp):', s3.teamsWithInterpretation, s3.teamsOk);
    if (s3.teamsOk !== 1) throw new Error('Should be OK');

    // 4. Global Snapshot
    const g = await getGlobalHealthSnapshot();
    console.log('Global:', g.totalTeams, g.totalOk);
    if (g.totalTeams < 1) throw new Error('Global snapshot missing team');

    // Cleanup
    await query(`DELETE FROM weekly_interpretations WHERE org_id = $1`, [orgId]);
    await query(`DELETE FROM org_aggregates_weekly WHERE org_id = $1`, [orgId]);
    await query(`DELETE FROM teams WHERE org_id = $1`, [orgId]);
    await query(`DELETE FROM orgs WHERE org_id = $1`, [orgId]);

    console.log('\n✓ Health Snapshot Verified');
}

verifyHealthSnapshot().catch(e => {
    console.error(e);
    process.exit(1);
});

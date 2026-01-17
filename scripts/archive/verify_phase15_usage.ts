
import './_bootstrap';
import { query } from '@/db/client';
import { getOrCreateTeamInterpretation } from '@/services/interpretation/service';
import { logInterpretationUsage, checkTokenBudget } from '@/services/monitoring/usage';
import { randomUUID } from 'crypto';

async function verifyUsageTracking() {
    console.log('--- Verifying Usage Tracking ---');
    const orgId = randomUUID();
    const teamId = randomUUID();

    // Setup 
    await query(`INSERT INTO orgs (org_id, name) VALUES ($1, $2)`, [orgId, orgId]);
    await query(`INSERT INTO teams (team_id, org_id, name) VALUES ($1, $2, $3)`, [teamId, orgId, teamId]);

    // 1. Manually log usage
    const logStart = Date.now();
    await logInterpretationUsage({
        orgId,
        teamId,
        weekStart: '2023-01-01',
        inputHash: 'test_hash',
        modelId: 'test_model',
        promptTokens: 100,
        completionTokens: 50,
        latencyMs: 500,
        provider: 'test_provider',
        isFallback: false
    });

    // Verify DB
    const rows = await query(`SELECT * FROM interpretation_usage WHERE org_id = $1`, [orgId]);
    if (rows.rows.length !== 1) throw new Error('Usage not logged');
    if (rows.rows[0].total_tokens !== 150) throw new Error('Token sum incorrect');
    console.log('✓ Manual logging passed');

    // 2. Check Budget
    const budgetOk = await checkTokenBudget(orgId, 200); // Limit 200 > 150 used
    if (!budgetOk) throw new Error('Budget check failed (should be OK)');

    const budgetFail = await checkTokenBudget(orgId, 100); // Limit 100 < 150 used
    if (budgetFail) throw new Error('Budget check failed (should FAIL)');
    console.log('✓ Budget check passed');

    // Cleanup
    await query(`DELETE FROM interpretation_usage WHERE org_id = $1`, [orgId]);
    await query(`DELETE FROM teams WHERE team_id = $1`, [teamId]);
    await query(`DELETE FROM orgs WHERE org_id = $1`, [orgId]);
}

verifyUsageTracking().catch(e => {
    console.error(e);
    process.exit(1);
});

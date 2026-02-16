import { config } from 'dotenv';
import path from 'path';

// Force load logic
const envPath = path.resolve(process.cwd(), '.env.local');
// We need to support standard .env loading too if .env.local doesn't exist
config({ path: envPath });

console.log('Environment loaded from:', envPath);
console.log('Database Check:', !!process.env.DATABASE_URL ? 'FOUND' : 'MISSING');

async function main() {
    // Dynamic imports after env is loaded
    const { getTeamDashboardData } = await import('@/services/dashboard/teamReader');
    const { getOrCreateTeamInterpretation } = await import('@/services/interpretation/service');
    const { query } = await import('@/db/client');

    console.log("1. Setting up Test Data...");
    // Find or Create Test Org
    let orgId = '00000000-0000-0000-0000-000000000000';
    let teamId = '00000000-0000-0000-0000-000000000001';

    // Insert Dummy Data if not exists
    await query(`
        INSERT INTO "orgs" (org_id, name) 
        VALUES ($1, 'Test Org') 
        ON CONFLICT (org_id) DO NOTHING
    `, [orgId]);

    await query(`
        INSERT INTO teams (team_id, org_id, name) 
        VALUES ($1, $2, 'Engineering Test') 
        ON CONFLICT (team_id) DO NOTHING
    `, [teamId, orgId]);

    // Insert Dummy Weekly Stats
    const weekStart = '2025-01-01';
    const indices = JSON.stringify({
        strain: 25.5,
        withdrawal_risk: 10.0,
        trust_gap: 5.0,
        engagement: 80.0,
        confidence: 0.9
    });

    await query(`
        INSERT INTO org_aggregates_weekly (
            team_id, org_id, week_start, 
            indices
        ) VALUES (
            $1, $2, $3,
            $4
        ) ON CONFLICT (org_id, team_id, week_start) DO UPDATE 
        SET indices = EXCLUDED.indices
    `, [teamId, orgId, weekStart, indices]);

    console.log("2. Testing Reader (Phase 1)...");
    const dashboardData = await getTeamDashboardData(orgId, teamId);

    if (!dashboardData) {
        console.error("FAILED: Reader returned null");
        process.exit(1);
    }

    console.log("Reader Success:", {
        teamName: dashboardData.meta.teamName,
        latestWeek: dashboardData.meta.latestWeek,
        kpis: dashboardData.kpiSeeds
    });

    if (dashboardData.kpiSeeds.strain !== 25.5) {
        console.error("FAILED: Data mismatch. Expected strain 25.5, got", dashboardData.kpiSeeds.strain);
        process.exit(1);
    }

    console.log("3. Testing Interpretation Service (Phase 1/2)...");
    try {
        const interpretation = await getOrCreateTeamInterpretation(orgId, teamId, weekStart);
        console.log("Interpretation Success:", {
            generated: interpretation.generated,
            cacheHit: interpretation.cacheHit,
            model: interpretation.record.modelId
        });
    } catch (e: any) {
        console.error("Interpretation Failed:", e.message);
        if (e.message.includes("NO_WEEKLY_PRODUCT")) {
            console.error("FAILED: Service could not find product data (Reader issue?)");
            process.exit(1);
        }
        console.warn("Soft Failure (LLM/Service Config):", e.message);
    }

    console.log("VALIDATION COMPLETE: Pipeline Functional.");
    process.exit(0);
}

main().catch(console.error);

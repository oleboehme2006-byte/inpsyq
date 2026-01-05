/**
 * ENSURE DEV FIXTURES — Extended for Phase 24.3 E2E
 * 
 * Idempotent script to create:
 * - Org A, Org B
 * - Teams: Engineering, Sales (in Org A)
 * - Users: EMPLOYEE, TEAMLEAD, EXECUTIVE, ADMIN, MULTI_ORG
 * - Weekly data for dashboards
 * 
 * Outputs: artifacts/phase24_3/fixtures.json
 */

import './_bootstrap';
import { query } from '../db/client';
import { getCanonicalWeek } from '../lib/week';
import * as fs from 'fs';
import * as path from 'path';

// Fixture Constants
const ORG_A_ID = '11111111-1111-4111-8111-111111111111';
const ORG_B_ID = '11111111-1111-4111-8111-222222222222';

const TEAM_ENG_ID = '22222222-2222-4222-8222-222222222201';
const TEAM_SALES_ID = '22222222-2222-4222-8222-222222222202';

// User IDs by role
const USER_EMPLOYEE_ID = '33333333-3333-4333-8333-000000000001';
const USER_TEAMLEAD_ID = '33333333-3333-4333-8333-000000000002';
const USER_EXECUTIVE_ID = '33333333-3333-4333-8333-000000000003';
const USER_ADMIN_ID = '33333333-3333-4333-8333-000000000004';
const USER_MULTI_ORG_ID = '33333333-3333-4333-8333-000000000005';

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ENSURING DEV FIXTURES (Phase 24.3 E2E)');
    console.log('═══════════════════════════════════════════════════════════════');

    // 1. Upsert Orgs
    try {
        await query(`
            INSERT INTO orgs (org_id, name)
            VALUES 
                ($1, 'Acme Corp (Org A)'),
                ($2, 'Beta Inc (Org B)')
            ON CONFLICT (org_id) DO UPDATE SET name = EXCLUDED.name;
        `, [ORG_A_ID, ORG_B_ID]);
        console.log('✓ Orgs ensured (A + B)');
    } catch (e) {
        console.error('Failed to upsert orgs:', e);
        process.exit(1);
    }

    // 2. Upsert Teams (in Org A)
    try {
        await query(`
            INSERT INTO teams (team_id, org_id, name)
            VALUES 
                ($1, $3, 'Engineering'),
                ($2, $3, 'Sales')
            ON CONFLICT (team_id) DO UPDATE SET name = EXCLUDED.name;
        `, [TEAM_ENG_ID, TEAM_SALES_ID, ORG_A_ID]);
        console.log('✓ Teams ensured (Engineering, Sales)');
    } catch (e) {
        console.error('Failed to upsert teams:', e);
        process.exit(1);
    }

    // 3. Upsert Users
    const users = [
        { id: USER_EMPLOYEE_ID, orgId: ORG_A_ID, teamId: TEAM_ENG_ID },
        { id: USER_TEAMLEAD_ID, orgId: ORG_A_ID, teamId: TEAM_ENG_ID },
        { id: USER_EXECUTIVE_ID, orgId: ORG_A_ID, teamId: null },
        { id: USER_ADMIN_ID, orgId: ORG_A_ID, teamId: null },
        { id: USER_MULTI_ORG_ID, orgId: ORG_A_ID, teamId: null },
    ];

    for (const u of users) {
        try {
            await query(`
                INSERT INTO users (user_id, org_id, team_id, is_active)
                VALUES ($1, $2, $3, TRUE)
                ON CONFLICT (user_id) DO NOTHING;
            `, [u.id, u.orgId, u.teamId]);
        } catch (e) {
            console.error(`Failed to upsert user ${u.id}:`, e);
        }
    }
    console.log('✓ Users ensured (5 test users)');

    // 4. Upsert Memberships
    const memberships = [
        { userId: USER_EMPLOYEE_ID, orgId: ORG_A_ID, teamId: TEAM_ENG_ID, role: 'EMPLOYEE' },
        { userId: USER_TEAMLEAD_ID, orgId: ORG_A_ID, teamId: TEAM_ENG_ID, role: 'TEAMLEAD' },
        { userId: USER_EXECUTIVE_ID, orgId: ORG_A_ID, teamId: null, role: 'EXECUTIVE' },
        { userId: USER_ADMIN_ID, orgId: ORG_A_ID, teamId: TEAM_ENG_ID, role: 'ADMIN' },
        { userId: USER_MULTI_ORG_ID, orgId: ORG_A_ID, teamId: null, role: 'EXECUTIVE' },
        { userId: USER_MULTI_ORG_ID, orgId: ORG_B_ID, teamId: null, role: 'EXECUTIVE' },
    ];

    for (const m of memberships) {
        try {
            await query(`
                INSERT INTO memberships (user_id, org_id, team_id, role)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id, org_id) DO UPDATE SET role = $4, team_id = $3;
            `, [m.userId, m.orgId, m.teamId, m.role]);
        } catch (e) {
            console.error(`Failed to upsert membership:`, e);
        }
    }
    console.log('✓ Memberships ensured (6 memberships)');

    // 5. Upsert Weekly Data (Current Week)
    const { weekStartStr } = getCanonicalWeek();
    const mockMeans = JSON.stringify({ "p1": 0.5, "p2": 0.5 });
    const mockIndices = JSON.stringify({
        strain_index: 0.45,
        engagement_index: 0.65,
        withdrawal_risk: 0.25,
        trust_gap: 0.35
    });

    for (const teamId of [TEAM_ENG_ID, TEAM_SALES_ID]) {
        try {
            await query(`
                INSERT INTO org_aggregates_weekly 
                (org_id, team_id, week_start, parameter_means, parameter_uncertainty, indices, contributions_breakdown)
                VALUES ($1, $2, $3, $4, $4, $5, '{}')
                ON CONFLICT (org_id, team_id, week_start) 
                DO UPDATE SET indices = EXCLUDED.indices;
            `, [ORG_A_ID, teamId, weekStartStr, mockMeans, mockIndices]);
        } catch (e) {
            console.error(`Failed to upsert aggregates for team ${teamId}:`, e);
        }

        try {
            await query(`
                INSERT INTO weekly_interpretations
                (id, org_id, team_id, week_start, is_active, sections_json, model_id, input_hash, prompt_version)
                VALUES (gen_random_uuid(), $1, $2, $3, TRUE, $4, 'dev-fixture', 'dummy-hash', '1.0')
                ON CONFLICT DO NOTHING;
            `, [ORG_A_ID, teamId, weekStartStr, JSON.stringify({ executiveSummary: "Fixture Summary" })]);
        } catch (e) {
            // Ignore duplicates
        }
    }
    console.log(`✓ Weekly Data ensured for ${weekStartStr}`);

    // 6. Output fixtures.json
    const artifactsDir = path.join(process.cwd(), 'artifacts', 'phase24_3');
    fs.mkdirSync(artifactsDir, { recursive: true });

    const fixtures = {
        orgA: ORG_A_ID,
        orgB: ORG_B_ID,
        teamEngineering: TEAM_ENG_ID,
        teamSales: TEAM_SALES_ID,
        users: {
            employee: USER_EMPLOYEE_ID,
            teamlead: USER_TEAMLEAD_ID,
            executive: USER_EXECUTIVE_ID,
            admin: USER_ADMIN_ID,
            multiOrg: USER_MULTI_ORG_ID,
        },
        weekStart: weekStartStr,
    };

    fs.writeFileSync(
        path.join(artifactsDir, 'fixtures.json'),
        JSON.stringify(fixtures, null, 2)
    );
    console.log(`✓ Wrote artifacts/phase24_3/fixtures.json`);

    console.log('');
    console.log('\x1b[32m✓ FIXTURES READY FOR E2E\x1b[0m');
}

main().catch(e => {
    console.error('Fixture Error:', e);
    process.exit(1);
});

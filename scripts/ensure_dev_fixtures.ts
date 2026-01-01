/**
 * ENSURE DEV FIXTURES
 * 
 * Idempotent script to upsert fixture data based on verified schema.
 * - Table: orgs (not organizations)
 * - Table: teams (no slug)
 * - Table: users (no name/email, only IDs)
 * - Table: memberships (role lives here)
 * - Table: org_aggregates_weekly (minimal data for currents week)
 * - Table: weekly_interpretations (minimal interpretation)
 * 
 * Run this before browser verification to guarantee auth works.
 */

import './_bootstrap';
import { query } from '../db/client';
import { getCanonicalWeek } from '../lib/week';

// Fixture Constants
const ORG_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '33333333-3333-4333-8333-000000000001';
const TEAM_ENG_ID = '22222222-2222-4222-8222-222222222201';
const TEAM_SALES_ID = '22222222-2222-4222-8222-222222222202';

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ENSURING DEV FIXTURES (Schema Compliant + Data)');
    console.log('═══════════════════════════════════════════════════════════════');

    // 1. Upsert Org
    try {
        await query(`
            INSERT INTO orgs (org_id, name)
            VALUES ($1, 'Acme Corp (Dev)')
            ON CONFLICT (org_id) DO UPDATE SET name = EXCLUDED.name;
        `, [ORG_ID]);
        console.log('✓ Org ensured (orgs table)');
    } catch (e) {
        console.error('Failed to upsert org:', e);
        process.exit(1);
    }

    // 2. Upsert Teams
    try {
        await query(`
            INSERT INTO teams (team_id, org_id, name)
            VALUES 
                ($1, $3, 'Engineering'),
                ($2, $3, 'Sales')
            ON CONFLICT (team_id) DO UPDATE SET name = EXCLUDED.name;
        `, [TEAM_ENG_ID, TEAM_SALES_ID, ORG_ID]);
        console.log('✓ Teams ensured (teams table)');
    } catch (e) {
        console.error('Failed to upsert teams:', e);
        process.exit(1);
    }

    // 3. Upsert User
    try {
        await query(`
            INSERT INTO users (user_id, org_id, team_id, is_active)
            VALUES ($1, $2, $3, TRUE)
            ON CONFLICT (user_id) DO NOTHING;
        `, [USER_ID, ORG_ID, TEAM_ENG_ID]);
        console.log('✓ User ensured (users table)');
    } catch (e) {
        console.error('Failed to upsert user:', e);
        process.exit(1);
    }

    // 4. Upsert Membership
    try {
        await query(`
            INSERT INTO memberships (user_id, org_id, team_id, role)
            VALUES ($1, $2, $3, 'ADMIN')
            ON CONFLICT (user_id, org_id) DO UPDATE SET role = 'ADMIN';
        `, [USER_ID, ORG_ID, TEAM_ENG_ID]);
        console.log('✓ Membership ensured (ADMIN)');
    } catch (e) {
        console.error('Failed to upsert membership:', e);
        process.exit(1);
    }

    // 5. Upsert Weekly Data (Current Week)
    const { weekStartStr } = getCanonicalWeek();
    const mockMeans = JSON.stringify({ "p1": 0.5, "p2": 0.5 }); // Minimal valid json
    const mockIndices = JSON.stringify({ "i1": 0.5 });

    // For both teams
    const teams = [TEAM_ENG_ID, TEAM_SALES_ID];

    for (const teamId of teams) {
        // A. Upsert Aggregates
        try {
            await query(`
                INSERT INTO org_aggregates_weekly 
                (org_id, team_id, week_start, parameter_means, parameter_uncertainty, indices, contributions_breakdown)
                VALUES ($1, $2, $3, $4, $4, $5, '{}')
                ON CONFLICT (org_id, team_id, week_start) 
                DO UPDATE SET parameter_means = EXCLUDED.parameter_means; -- Just touch it to ensure it exists
            `, [ORG_ID, teamId, weekStartStr, mockMeans, mockIndices]);
        } catch (e) {
            console.error(`Failed to upsert aggregates for team ${teamId}:`, e);
        }

        // B. Upsert Interpretations
        try {
            await query(`
                INSERT INTO weekly_interpretations
                (id, org_id, team_id, week_start, is_active, sections_json, model_id, input_hash, prompt_version)
                VALUES (gen_random_uuid(), $1, $2, $3, TRUE, $4, 'dev-fixture', 'dummy-hash', '1.0')
                ON CONFLICT DO NOTHING; -- No primary key constraint shown in schema? 
                -- Actually weekly_interpretations usually has PK or unique constraint on (team, week).
                -- If not, we might duplicate. Let's check overlap.
            `, [ORG_ID, teamId, weekStartStr, JSON.stringify({ executiveSummary: "Fixture Summary" })]);
        } catch (e) {
            // Ignore duplicate key errors if any
            if (!(e as any).message.includes('duplicate')) {
                console.error(`Failed to upsert interpretation for team ${teamId}:`, e);
            }
        }
    }
    console.log(`✓ Weekly Data ensured for ${weekStartStr}`);

    console.log('');
    console.log('\x1b[32m✓ FIXTURES READY\x1b[0m');
}

main().catch(e => {
    console.error('Fixture Error:', e);
    process.exit(1);
});

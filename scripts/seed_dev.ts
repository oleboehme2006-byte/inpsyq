/**
 * Development Seed Script (Deterministic)
 * 
 * Creates stable test data with fixed UUIDs.
 * Same IDs every run = reproducible tests.
 * 
 * Usage: npm run seed:dev
 */

// CRITICAL: loadEnv MUST be called before any other imports
import './_bootstrap';
// Env loaded by bootstrap

// Now safe to import modules that use process.env
import { query } from '../db/client';
import { DEV_ORG_ID, DEV_ORG_NAME, DEV_TEAMS, DEV_USERS } from '../lib/dev/fixtures';

async function seedDev() {
    console.log('=== Development Seed (Deterministic) ===\n');

    try {
        // Create organization
        console.log(`Creating org: ${DEV_ORG_ID.slice(0, 8)}...`);
        await query(`
            INSERT INTO orgs (org_id, name)
            VALUES ($1, $2)
            ON CONFLICT (org_id) DO UPDATE SET name = $2
        `, [DEV_ORG_ID, DEV_ORG_NAME]);

        // Create teams
        console.log(`Creating ${DEV_TEAMS.length} teams...`);
        for (const team of DEV_TEAMS) {
            await query(`
                INSERT INTO teams (team_id, org_id, name)
                VALUES ($1, $2, $3)
                ON CONFLICT (team_id) DO UPDATE SET name = $3
            `, [team.id, DEV_ORG_ID, team.name]);
        }

        // Create users and memberships
        console.log(`Creating ${DEV_USERS.length} users and memberships...`);
        for (const user of DEV_USERS) {
            // User
            await query(`
                INSERT INTO users (user_id, org_id, team_id, is_active)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id) DO UPDATE SET is_active = $4
            `, [user.id, DEV_ORG_ID, user.teamId, true]);

            // Membership (Deterministic ID derived from user ID)
            // User ID: 33333333-3333-4333-8333-xxxxxxxxxxxx
            // Mem ID:  44444444-4444-4444-8444-xxxxxxxxxxxx (just change prefix/variant)
            // Simple hack: replace leading 3s with 4s
            const membershipId = user.id.replace(/^33333333-3333-4333-8333/, '44444444-4444-4444-8444');

            await query(`
                INSERT INTO memberships (membership_id, user_id, org_id, team_id, role)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id, org_id) DO UPDATE SET role = $5, team_id = $4
            `, [membershipId, user.id, DEV_ORG_ID, user.teamId, 'MEMBER']);
        }

        console.log('\n=== Seed Complete ===\n');
        console.log('Stable IDs (same every run):\n');
        console.log(`  ORG_ID=${DEV_ORG_ID}`);
        console.log(`  TEAM_ID=${DEV_TEAMS[0].id}`);
        console.log(`  USER_ID=${DEV_USERS[0].id}`);
        console.log('');
        console.log('Test commands:');
        console.log(`  npm run ids`);
        console.log(`  npm run sim:dev:small`);
        console.log('');

    } catch (error: any) {
        console.error('Seed failed:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

seedDev();

#!/usr/bin/env npx tsx
/**
 * One-off script to create the missing 'memberships' table.
 */
import './_bootstrap';
import { query } from '../db/client';

async function main() {
    console.log('Creating memberships table...');
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS memberships (
                membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                org_id UUID NOT NULL,
                team_id UUID,
                role TEXT NOT NULL DEFAULT 'EMPLOYEE',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE (user_id, org_id)
            );
        `);
        console.log('Table created (or already exists).');

        // Create indexes
        await query(`
            CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
            CREATE INDEX IF NOT EXISTS idx_memberships_org_id ON memberships(org_id);
        `);
        console.log('Indexes created.');

        // Seed test data with CORRECT IDs
        // User 3 is in Team 0 (Engineering) in fixtures
        await query(`
            INSERT INTO memberships (user_id, org_id, team_id, role)
            VALUES ($1, $2, $3, 'TEAMLEAD')
            ON CONFLICT (user_id, org_id) DO UPDATE SET team_id = $3, role = 'TEAMLEAD'
        `, [
            '33333333-3333-4333-8333-000000000003', // User 3
            '11111111-1111-4111-8111-111111111111', // DEV_ORG_ID
            '22222222-2222-4222-8222-222222222201'  // DEV_TEAMS[0].id
        ]);
        console.log('Test membership seeded.');

    } catch (e: any) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

main();

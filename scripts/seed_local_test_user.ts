/**
 * Seed Local Test User
 * 
 * Creates 'test-local-admin@inpsyq.com' in the local database for E2E testing.
 */

import './_bootstrap';
import { query } from '@/db/client';
import { randomUUID } from 'crypto';

async function main() {
    const email = 'test-local-admin@inpsyq.com';
    const orgId = randomUUID();
    const orgName = 'Test Org ' + orgId.slice(0, 8);

    // Check if user exists
    const res = await query(`SELECT user_id FROM users WHERE email = $1`, [email]);
    if (res.rows.length > 0) {
        console.log(`User ${email} already exists.`);
        const userId = res.rows[0].user_id;

        // Ensure membership exists
        const memRes = await query(`SELECT membership_id FROM memberships WHERE user_id = $1`, [userId]);
        if (memRes.rows.length === 0) {
            console.log('Recovering membership...');
            // Try 'id' for organizations table based on error
            await query(`INSERT INTO organizations (id, name) VALUES ($1, $2)`, [orgId, orgName]);
            await query(
                `INSERT INTO memberships (user_id, org_id, role) VALUES ($1, $2, 'ADMIN')`,
                [userId, orgId]
            );
            console.log(`Recovered membership for ${email}`);
        }
        return;
    }

    // Create org
    await query(`INSERT INTO organizations (id, name) VALUES ($1, $2)`, [orgId, orgName]);
    console.log(`Created org ${orgId}`);

    // Create user
    const insert = await query(
        `INSERT INTO users (email, name) VALUES ($1, 'Test Admin') RETURNING user_id`,
        [email]
    );
    const userId = insert.rows[0].user_id;

    // Create membership
    await query(
        `INSERT INTO memberships (user_id, org_id, role) VALUES ($1, $2, 'ADMIN')`,
        [userId, orgId]
    );

    console.log(`Created user ${email} (ID: ${userId})`);
}

main().catch(console.error);

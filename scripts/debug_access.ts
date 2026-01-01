import './_bootstrap';
import { query } from '@/db/client';

const USER_ID = '33333333-3333-4333-8333-000000000001';
const TEAM_ID = '22222222-2222-4222-8222-222222222201';

async function debugAccess() {
    console.log('--- Debugging Access ---\n');

    // 1. Check User
    const userRes = await query('SELECT * FROM users WHERE id = $1', [USER_ID]);
    console.log(`User found: ${userRes.rows.length}`);
    if (userRes.rows.length > 0) {
        console.log('User roles:', userRes.rows[0].roles);
    }

    // 2. Check Team Membership
    const memRes = await query('SELECT * FROM memberships WHERE user_id = $1 AND team_id = $2', [USER_ID, TEAM_ID]);
    console.log(`Team Membership found: ${memRes.rows.length}`);
    if (memRes.rows.length > 0) {
        console.log('Membership:', memRes.rows[0]);
    }

    // 3. Check Org Membership
    const orgRes = await query('SELECT * FROM org_memberships WHERE user_id = $1', [USER_ID]);
    console.log(`Org Membership found: ${orgRes.rows.length}`);
}

debugAccess().catch(console.error);

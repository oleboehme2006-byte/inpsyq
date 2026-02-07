import './_bootstrap';
import { query } from '@/db/client';

const USER_ID = '33333333-3333-4333-8333-000000000001';

async function promoteUser() {
    console.log('Promoting user to ADMIN (OWNER)...');

    // Update all memberships to ADMIN (EXECUTIVE/ADMIN equivalent)
    await query(`
        UPDATE memberships SET role = 'ADMIN' WHERE user_id = $1
    `, [USER_ID]);

    console.log('User promoted to ADMIN');
}

promoteUser().catch(console.error);

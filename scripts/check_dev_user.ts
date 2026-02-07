
import { query, pool } from '../db/client';

async function main() {
    try {
        const userId = '33333333-3333-4333-8333-000000000001';
        const res = await query('SELECT role, email FROM users WHERE user_id = $1', [userId]);
        if (res.rows.length === 0) {
            console.log('User not found');
        } else {
            console.log('Dev User:', res.rows[0]);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();

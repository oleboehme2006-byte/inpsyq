
import { query } from '@/db/client';

async function main() {
    console.log('Checking user oleboehme2006@gmail.com...');
    const res = await query('SELECT user_id, email, name, clerk_id FROM users WHERE email = $1', ['oleboehme2006@gmail.com']);
    if (res.rows.length === 0) {
        console.log('User NOT FOUND in DB.');
    } else {
        console.log('User FOUND:', res.rows[0]);
    }
}

main().catch(console.error);

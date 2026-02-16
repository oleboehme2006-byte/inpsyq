
import { query } from '@/db/client';

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: npx tsx scripts/set_clerk_id.ts <email> <clerk_id>');
        process.exit(1);
    }

    const [email, clerkId] = args;

    console.log(`Linking user ${email} to Clerk ID ${clerkId}...`);

    // First check if user exists
    const check = await query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (check.rows.length === 0) {
        console.error('User not found in DB!');
        process.exit(1);
    }

    // Update
    await query('UPDATE users SET clerk_id = $1 WHERE email = $2', [clerkId, email]);

    console.log('Success! User linked.');
}

main().catch(console.error);

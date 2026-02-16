
import { query } from '@/db/client';

async function migrate() {
    console.log('Migrating users table to support Clerk...');
    
    try {
        // Add clerk_id column
        await query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;
        `);
        
        // Add index
        await query(`
            CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
        `);

        console.log('✅ Migration successful: clerk_id column added.');
    } catch (e: any) {
        console.error('❌ Migration failed:', e.message);
    } finally {
        process.exit(0);
    }
}

migrate();

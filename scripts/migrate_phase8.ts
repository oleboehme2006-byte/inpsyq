
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Running Phase 8 Migration...');
    const { query } = await import('@/db/client');
    const { PIPELINE_MIGRATION_SQL } = await import('@/services/pipeline/schema');

    try {
        await query(PIPELINE_MIGRATION_SQL);
        console.log('Migration Successful.');
    } catch (e) {
        console.error('Migration Failed:', e);
        process.exit(1);
    }
    process.exit(0);
}

main();

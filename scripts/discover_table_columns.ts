import './_bootstrap';
import { query } from '@/db/client';
async function main() {
    const r = await query(`
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_name IN ('measurement_responses','measurement_sessions','responses','sessions')
          AND table_schema='public'
        ORDER BY table_name, ordinal_position
    `);
    for (const row of r.rows) {
        console.log(`${row.table_name.padEnd(28)} ${row.column_name.padEnd(26)} ${row.data_type}`);
    }
    // Also check existing indexes
    const idx = await query(`
        SELECT indexname, tablename, indexdef
        FROM pg_indexes
        WHERE schemaname='public'
          AND tablename IN ('teams','sessions','responses','org_aggregates_weekly',
                            'measurement_sessions','measurement_responses')
        ORDER BY tablename, indexname
    `);
    console.log('\nExisting indexes on target tables:');
    for (const row of idx.rows) {
        console.log(`  [${row.tablename}] ${row.indexname}`);
        console.log(`    ${row.indexdef}`);
    }
    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });

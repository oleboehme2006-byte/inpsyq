import './_bootstrap';
import { query } from '@/db/client';
async function main() {
    // Check FK constraints specifically for memberships
    const fks = await query(`
        SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS ref_table,
               confdeltype, pg_get_constraintdef(oid) AS def
        FROM pg_constraint
        WHERE conrelid = 'memberships'::regclass AND contype = 'f'
    `);
    console.log('Membership FKs:', fks.rows.length ? fks.rows : 'NONE FOUND');

    // Also list all tables in public schema
    const tables = await query(`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);
    console.log('\nAll tables:', tables.rows.map((r: any) => r.tablename).join(', '));
    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });

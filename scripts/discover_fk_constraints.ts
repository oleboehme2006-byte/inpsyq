/**
 * Discovery script — prints all FK constraints with current delete rules.
 * Run: npx tsx scripts/discover_fk_constraints.ts
 */
import './_bootstrap';
import { query } from '@/db/client';

async function main() {
    const res = await query(`
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name  AS foreign_table,
            ccu.column_name AS foreign_column,
            tc.constraint_name,
            rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema   = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema   = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
            ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema    = 'public'
        ORDER BY tc.table_name, kcu.column_name
    `);

    console.log('\nFK constraints in live DB:\n');
    console.log(
        `${'TABLE'.padEnd(32)} ${'COLUMN'.padEnd(28)} ${'REFERENCES'.padEnd(32)} ${'DELETE RULE'.padEnd(14)} CONSTRAINT NAME`
    );
    console.log('─'.repeat(130));
    for (const r of res.rows) {
        console.log(
            `${r.table_name.padEnd(32)} ${r.column_name.padEnd(28)} ${(r.foreign_table + '.' + r.foreign_column).padEnd(32)} ${r.delete_rule.padEnd(14)} ${r.constraint_name}`
        );
    }
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

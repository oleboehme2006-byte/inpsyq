/**
 * Apply Migration 011: Indexes, FK CASCADE rules, unique constraint
 *
 * Run: npx tsx scripts/apply_migration_011.ts
 */

import './_bootstrap';
import { query } from '@/db/client';
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
    console.log('🔧 Applying Migration 011: Indexes, CASCADE rules, unique constraint...\n');

    const sql = readFileSync(
        join(__dirname, '../db/migrations/011_indexes_cascades_unique.sql'),
        'utf-8'
    );

    await query(sql);

    console.log('✅ Migration 011 applied.\n');

    // Verify key artifacts
    const indexes = await query(`
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname IN (
              'idx_teams_org',
              'idx_responses_session',
              'idx_responses_interaction',
              'idx_oaw_team',
              'idx_oaw_org_week',
              'idx_responses_unique_answer'
          )
        ORDER BY tablename, indexname
    `);
    console.log('Indexes created:');
    for (const row of indexes.rows) {
        console.log(`  ✓ [${row.tablename}] ${row.indexname}`);
    }

    const fks = await query(`
        SELECT tc.table_name, kcu.column_name, rc.delete_rule, tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.referential_constraints AS rc
            ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND rc.delete_rule IN ('CASCADE', 'SET NULL')
        ORDER BY tc.table_name, kcu.column_name
    `);
    console.log('\nFK constraints with CASCADE/SET NULL:');
    for (const row of fks.rows) {
        console.log(`  ✓ ${row.table_name}.${row.column_name} → ${row.delete_rule} (${row.constraint_name})`);
    }

    const membershipFks = await query(`
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'memberships'::regclass AND contype = 'f'
    `);
    console.log(`\nmemberships FK count: ${membershipFks.rows.length}`);
    for (const row of membershipFks.rows) {
        console.log(`  ✓ ${row.conname}`);
    }

    console.log('\n✅ Migration 011 complete.');
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});

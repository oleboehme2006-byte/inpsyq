/**
 * Apply Migration 006: clerk_id and slug columns
 * 
 * Run: npx tsx scripts/apply_migration_006.ts
 */

import './_bootstrap';
import { query } from '@/db/client';
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
    console.log('🔧 Applying Migration 006: clerk_id + slug...\n');

    const sql = readFileSync(join(__dirname, '../db/migrations/006_clerk_id_and_slug.sql'), 'utf-8');
    await query(sql);
    console.log('✅ Schema migration applied.\n');

    // Backfill: Set slug for orgs without one
    const orgs = await query(`SELECT org_id, name FROM orgs WHERE slug IS NULL`);
    for (const org of orgs.rows) {
        let slug = org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        // Check for existing slug and append suffix if needed
        let suffix = 0;
        let candidate = slug;
        while (true) {
            const existing = await query(`SELECT 1 FROM orgs WHERE slug = $1`, [candidate]);
            if (existing.rows.length === 0) break;
            suffix++;
            candidate = `${slug}-${suffix}`;
        }
        slug = candidate;
        await query(`UPDATE orgs SET slug = $1 WHERE org_id = $2`, [slug, org.org_id]);
        console.log(`  → Set slug for "${org.name}": ${slug}`);
    }

    // Backfill: Set clerk_id for known user
    const CLERK_ID = 'user_39kfWFtJYsHeWI0DicPcWLzCj8w';
    const EMAIL = 'oleboehme2006@gmail.com';

    // Find user by email or by known membership
    const userResult = await query(
        `SELECT u.user_id FROM users u
         JOIN memberships m ON u.user_id = m.user_id
         JOIN orgs o ON m.org_id = o.org_id
         WHERE o.name = 'Apex Dynamics'
         LIMIT 1`
    );

    if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].user_id;
        // Check if clerk_id already set
        const existing = await query(`SELECT clerk_id FROM users WHERE user_id = $1`, [userId]);
        if (existing.rows[0]?.clerk_id === CLERK_ID) {
            console.log(`  → clerk_id already set for user ${userId}, skipping.`);
        } else {
            await query(
                `UPDATE users SET clerk_id = $1, email = $2 WHERE user_id = $3 AND (clerk_id IS NULL OR clerk_id = $1)`,
                [CLERK_ID, EMAIL, userId]
            );
            console.log(`  → Set clerk_id for user ${userId}: ${CLERK_ID}`);
            console.log(`  → Set email for user ${userId}: ${EMAIL}`);
        }
    } else {
        console.warn('⚠️ No Apex Dynamics user found to backfill clerk_id.');
    }

    console.log('\n✅ Migration 006 complete.');
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});

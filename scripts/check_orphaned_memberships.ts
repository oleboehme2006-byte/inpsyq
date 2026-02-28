import './_bootstrap';
import { query } from '@/db/client';
(async () => {
    const orphanedUsers = await query(`
        SELECT m.user_id, m.org_id, m.team_id
        FROM memberships m
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = m.user_id)
    `);
    console.log('Orphaned user_id rows:', orphanedUsers.rows.length);
    for (const r of orphanedUsers.rows) console.log(' ', r);

    const orphanedOrgs = await query(`
        SELECT m.user_id, m.org_id
        FROM memberships m
        WHERE NOT EXISTS (SELECT 1 FROM orgs o WHERE o.org_id = m.org_id)
    `);
    console.log('Orphaned org_id rows:', orphanedOrgs.rows.length);
    for (const r of orphanedOrgs.rows) console.log(' ', r);

    process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

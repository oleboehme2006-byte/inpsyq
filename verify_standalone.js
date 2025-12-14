const fs = require('fs');
const { Pool } = require('pg');

async function run() {
    console.log('[Verify] Reading .env.local...');
    let dbUrl = process.env.DATABASE_URL;

    if (!dbUrl && fs.existsSync('.env.local')) {
        const content = fs.readFileSync('.env.local', 'utf8');
        const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
        if (match) dbUrl = match[1];
    }

    if (!dbUrl) {
        console.error('[Verify] DATABASE_URL not found.');
        process.exit(1);
    }

    console.log('[Verify] Connecting to DB...');
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const orgRes = await pool.query('SELECT count(*) as c FROM orgs');
        const teamRes = await pool.query('SELECT count(*) as c FROM teams');
        const usersRes = await pool.query('SELECT count(*) as c FROM users');
        const aggRes = await pool.query('SELECT count(*) as c FROM org_aggregates_weekly');

        const report = {
            orgs: parseInt(orgRes.rows[0].c),
            teams: parseInt(teamRes.rows[0].c),
            users: parseInt(usersRes.rows[0].c),
            aggregates: parseInt(aggRes.rows[0].c)
        };

        console.log('[Verify] Report:', report);

        if (report.aggregates === 0) {
            console.error('[Verify] FAIL: No aggregates found.');
            process.exit(1);
        }

        console.log('[Verify] PASS');
        process.exit(0);

    } catch (e) {
        console.error('[Verify] Error:', e);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();

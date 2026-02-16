
import fs from 'fs';
import path from 'path';

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
    console.log('Loaded env from', envPath);
} else {
    // Try .env.development.local
    const devEnvPath = path.resolve(process.cwd(), '.env.development.local');
    if (fs.existsSync(devEnvPath)) {
        const envConfig = fs.readFileSync(devEnvPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                process.env[match[1]] = match[2];
            }
        });
        console.log('Loaded env from', devEnvPath);
    } else {
        console.error('No .env found');
        process.exit(1);
    }
}

async function main() {
    // Dynamic imports
    const { runWeekly } = await import('@/services/weeklyRunner/runner');
    const { query } = await import('@/db/client');

    const orgId = '11111111-1111-4111-8111-111111111111'; // Test Org
    // Use last week start to ensure data exists (or current week if seeded)
    // Run for a specific week or default (current)
    const targetDate = new Date('2026-02-16'); // Monday

    console.log(`Triggering FULL pipeline for Org: ${orgId}`);

    try {
        const result = await runWeekly({
            orgId,
            weekStart: targetDate.toISOString().slice(0, 10),
            options: { mode: 'FULL' }
        });

        console.log('Pipeline Result:', JSON.stringify(result.counts, null, 2));

        if (result.status !== 'completed') {
            console.error('Pipeline failed or partial:', result.error);
        }

        // Verify Org Stats
        const statsRes = await query('SELECT * FROM org_stats_weekly WHERE org_id = $1', [orgId]);
        console.log(`Org Stats Rows: ${statsRes.rows.length}`);
        if (statsRes.rows.length > 0) {
            console.log('Sample Org Stats:', JSON.stringify(statsRes.rows[0].indices));
            console.log('Systemic Drivers:', JSON.stringify(statsRes.rows[0].systemic_drivers));
            console.log('Series Points:', statsRes.rows[0].series?.points?.length);
        }

        // Verify Interpretation
        const interpRes = await query('SELECT * FROM weekly_interpretations WHERE org_id = $1 AND team_id IS NULL', [orgId]);
        console.log(`Org Interpretations: ${interpRes.rows.length}`);
        if (interpRes.rows.length > 0) {
            console.log('Latest Interpretation ID:', interpRes.rows[0].id);
        }

    } catch (err) {
        console.error('Test Error:', err);
    } finally {
        process.exit(0);
    }
}

main();

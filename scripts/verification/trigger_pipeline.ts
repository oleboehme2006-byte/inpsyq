
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
    console.error('.env.local not found at', envPath);
    process.exit(1);
}

async function main() {
    // Dynamic import to ensure env vars are loaded first
    const { runWeeklyRollup } = await import('@/services/pipeline/runner');

    const orgId = '11111111-1111-4111-8111-111111111111';
    const teamId = '22222222-2222-4222-8222-222222222201'; // Engineering
    const targetDate = new Date('2026-02-15T12:00:00Z');

    console.log(`Triggering pipeline for Org: ${orgId}, Team: ${teamId}, Date: ${targetDate.toISOString()}`);

    try {
        const result = await runWeeklyRollup(orgId, teamId, targetDate);
        console.log('Pipeline Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Pipeline Error:', err);
    } finally {
        process.exit(0);
    }
}

main();

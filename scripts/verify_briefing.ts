
export { };


import fs from 'fs';
import path from 'path';

// 0. DX: Ensure running from Root
if (!fs.existsSync(path.join(process.cwd(), 'package.json')) && !fs.existsSync(path.join(process.cwd(), 'tsconfig.json'))) {
    console.error('\n❌ Error: Wrong Working Directory');
    console.error('Please run this command from the project root:');
    console.error('   cd /Users/ole/Projects/inpsyq');
    process.exit(1);
}

const BASE_URL = 'http://localhost:3001';

async function run() {
    console.log('--- Verifying Briefing Layer ---');

    // 1. Seed to get IDs
    console.log('1. Fetching IDs (Seeding/Checking)...');

    // Check if we can get existing from seed API (dev only)
    let orgId, teamId, weekStart;

    try {
        const seedRes = await fetch(`${BASE_URL}/api/seed`, { method: 'GET' });
        if (seedRes.status === 403) {
            console.log('   Production mode detected. Manual ID input required or check existing DB.');
            // Fallback hardcoded or error out. 
            // In local dev `npm run dev` handles API seed usually.
        } else {
            const seedData = await seedRes.json();
            orgId = seedData.org_id;
            teamId = seedData.team_id;
            // Find a week
            const weeklyRes = await fetch(`${BASE_URL}/api/admin/weekly?org_id=${orgId}&team_id=${teamId}`);
            const wData = await weeklyRes.json();
            if (wData.length) weekStart = wData[wData.length - 1].week_start;
        }
    } catch (e) {
        console.error('Seed/Fetch failed', e);
    }

    if (!orgId || !teamId || !weekStart) {
        console.error('FAIL: Could not determine Org/Team/Week to test.');
        process.exit(1);
    }

    console.log(`   Target: Org=${orgId}, Team=${teamId}, Week=${weekStart}`);

    // 2. Call Briefing API
    console.log('2. Generating Brief...');
    const t0 = Date.now();
    const res = await fetch(`${BASE_URL}/api/admin/brief?org_id=${orgId}&team_id=${teamId}&week_start=${weekStart}`);
    const t1 = Date.now();

    if (!res.ok) {
        console.error(`FAIL: API returned ${res.status}`, await res.text());
        process.exit(1);
    }

    const brief = await res.json();
    console.log(`   Success (took ${t1 - t0}ms)`);

    // 3. Validate Schema
    if (!brief.headline || !brief.state_summary || !brief.citation) {
        // checks
    }

    console.log('   [Headline]:', brief.headline);
    console.log('   [Confidence]:', brief.confidence_statement);
    console.log('   [Citations]:', brief.citations.length);

    if (brief.citations.some((c: any) => c.source === 'DecisionSnapshot')) {
        console.log('PASS: Brief contains expected citations.');
    } else {
        console.error('FAIL: Missing citations.');
        process.exit(1);
    }
}

run();

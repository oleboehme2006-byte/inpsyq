
/**
 * SEED FULL CLIENT — End-to-End Verification Seed
 * 
 * Creates a complete client environment ("Apex Dynamics") linked to a real Clerk Identity.
 * Generates 8 weeks of historical data and runs the full pipeline (Measurement -> Attribution -> Interpretation).
 * 
 * Usage: npx tsx scripts/seed_client_full.ts
 */

import './_bootstrap';
import { query } from '@/db/client';
import { randomUUID } from 'crypto';
import { subWeeks, startOfISOWeek, addDays } from 'date-fns';
import { runWeeklyRollup } from '@/services/pipeline/runner';
import { getOrCreateTeamInterpretation, getOrCreateOrgInterpretation } from '@/services/interpretation/service';

// Configuration
const CONFIG = {
    orgName: 'Apex Dynamics',
    user: {
        email: 'oleboehme2006@gmail.com',
        name: 'Ole Boehme',
        clerkId: 'user_39kfWFtJYsHeWI0DicPcWLzCj8w',
        role: 'EXECUTIVE'
    },
    teams: [
        { name: 'Engineering', bias: 'negative', volatility: 20 },
        { name: 'Sales', bias: 'positive', volatility: 10 },
        { name: 'Product', bias: 'mixed', volatility: 15 }
    ],
    weeksHistory: 8,
    employeesPerTeam: 15
};

// Global State
let ORG_ID: string;
const TEAM_IDS: Record<string, string> = {}; // name -> uuid
const CREATED_USERS: Record<string, string[]> = {}; // teamId -> userIds

async function main() {
    console.log('🌱 Starting Full Client Seed for Verification...');

    try {
        // 1. Create/Find Organization
        await seedOrganization();
        console.log(`Org ID Resolved: ${ORG_ID}`);

        // 2. Create/Link User
        await seedUser();

        // 3. Create Teams & Memberships
        await seedTeams();

        // 4. Seed History & Run Pipeline
        await seedHistory();

        console.log('\n✅ Seeding Complete!');
        console.log(`\nLogin as ${CONFIG.user.email} to verify.`);
        console.log(`Org ID: ${ORG_ID}`);
        process.exit(0);

    } catch (err: any) {
        console.error('❌ Seeding Failed:', err);
        process.exit(1);
    }
}

async function seedOrganization() {
    process.stdout.write('🏢 Finding/Creating Organization... ');

    // Check if exists by name
    const existing = await query('SELECT org_id FROM orgs WHERE name = $1', [CONFIG.orgName]);

    if (existing.rows.length > 0) {
        ORG_ID = existing.rows[0].org_id;
        console.log(`Found existing (${ORG_ID})`);
    } else {
        ORG_ID = randomUUID();
        // Schema: org_id (PK), name
        await query(
            `INSERT INTO orgs (org_id, name) VALUES ($1, $2)`,
            [ORG_ID, CONFIG.orgName]
        );
        console.log(`Created new (${ORG_ID})`);
    }
}

async function seedUser() {
    process.stdout.write('👤 Seeding User... ');

    // Check if user exists by email
    const existing = await query('SELECT user_id FROM users WHERE email = $1', [CONFIG.user.email]);
    let userId;

    if (existing.rows.length > 0) {
        userId = existing.rows[0].user_id;
        // Update Clerk ID and Name (Role is in memberships)
        await query(
            `UPDATE users SET clerk_id = $1, name = $2 WHERE user_id = $3`,
            [CONFIG.user.clerkId, CONFIG.user.name, userId]
        );
    } else {
        userId = randomUUID();
        // users table schema: user_id, email, name, clerk_id (no role)
        await query(
            `INSERT INTO users (user_id, email, name, clerk_id) 
             VALUES ($1, $2, $3, $4)`,
            [userId, CONFIG.user.email, CONFIG.user.name, CONFIG.user.clerkId]
        );
    }

    // Ensure Membership with Role
    await query(
        `INSERT INTO memberships (user_id, org_id, role) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, org_id) DO UPDATE SET role = $3`,
        [userId, ORG_ID, CONFIG.user.role]
    );

    console.log(`Done (ID: ${userId})`);
}

async function seedTeams() {
    process.stdout.write('👥 Creating Teams... ');
    for (const team of CONFIG.teams) {
        // Find or Create Team
        const existing = await query('SELECT team_id FROM teams WHERE org_id = $1 AND name = $2', [ORG_ID, team.name]);
        let teamId;

        if (existing.rows.length > 0) {
            teamId = existing.rows[0].team_id;
        } else {
            teamId = randomUUID();
            await query(
                `INSERT INTO teams (team_id, org_id, name) VALUES ($1, $2, $3)`,
                [teamId, ORG_ID, team.name]
            );
        }
        TEAM_IDS[team.name] = teamId;

        // Create Employees
        if (!CREATED_USERS[teamId]) {
            CREATED_USERS[teamId] = [];
            for (let i = 0; i < CONFIG.employeesPerTeam; i++) {
                const uid = randomUUID();
                const email = `fake-${team.name.toLowerCase().substring(0, 3)}-${i}-${randomUUID().slice(0, 4)}@seed.com`;

                // User (no role column, but needs org_id and team_id for pipeline lookup)
                await query(
                    `INSERT INTO users (user_id, email, name, org_id, team_id, is_active) 
                     VALUES ($1, $2, $3, $4, $5, true) 
                     ON CONFLICT (user_id) DO UPDATE SET org_id = $4, team_id = $5`,
                    [uid, email, `Employee ${i} (${team.name})`, ORG_ID, teamId]
                );

                // Membership (role column here)
                await query(
                    `INSERT INTO memberships (user_id, org_id, team_id, role) VALUES ($1, $2, $3, 'EMPLOYEE') 
                     ON CONFLICT (user_id, org_id) DO UPDATE SET team_id = $3`,
                    [uid, ORG_ID, teamId]
                );
                CREATED_USERS[teamId].push(uid);
            }
        }
    }
    console.log('Done.');
}

async function seedHistory() {
    console.log('\n📅 Seeding History & Running Pipeline...');

    // Calculate week starts from oldest to newest
    const now = new Date();
    const currentWeekStart = startOfISOWeek(now);
    const weeks: Date[] = [];

    for (let i = CONFIG.weeksHistory - 1; i >= 0; i--) {
        weeks.push(subWeeks(currentWeekStart, i));
    }

    for (const weekStart of weeks) {
        console.log(`\nProcessing Week: ${weekStart.toISOString().split('T')[0]}`);

        for (const team of CONFIG.teams) {
            const teamId = TEAM_IDS[team.name];
            process.stdout.write(`  > Team ${team.name}: `);

            // A. Seed Data (Latent States + Sessions)
            // Note: Latent States reflect the current belief. 
            // We update them to what they "were" at this week.
            // When pipeline runs, it reads these "current" values.
            await seedLatentStatesAndSessions(team, teamId, weekStart);
            process.stdout.write('Data ✅ ');

            // B. Run Pipeline (Measurement + Attribution)
            const rollup = await runWeeklyRollup(ORG_ID, teamId, weekStart);
            if (rollup.skipped) process.stdout.write('Rollup ⏭️  ');
            else process.stdout.write('Rollup 🔄 ');

            // C. Generate Interpretation
            try {
                const interp = await getOrCreateTeamInterpretation(ORG_ID, teamId);
                process.stdout.write(interp.generated ? 'Interp ✨' : 'Interp 📦');
            } catch (e: any) {
                process.stdout.write(`Interp ❌ (${e.message})`);
            }
            console.log();
        }
    }

    // D. Run Org Rollup & Interpretation
    console.log('\n  > Organization Rollup...');
    try {
        const orgInterp = await getOrCreateOrgInterpretation(ORG_ID);
        console.log(orgInterp.generated ? '    Org Interp ✨' : '    Org Interp 📦');
    } catch (e: any) {
        console.error('    Org Interp Failed:', e.message);
    }
}

async function seedLatentStatesAndSessions(team: any, teamId: string, weekStart: Date) {
    const userIds = CREATED_USERS[teamId];
    // Factors matching standard analysis
    const factors = ['workload', 'autonomy', 'clarity', 'recognition', 'safety', 'trust'];

    // Determine trend based on week
    const allWeeksStart = subWeeks(startOfISOWeek(new Date()), CONFIG.weeksHistory - 1).getTime();
    const progress = Math.max(0, (weekStart.getTime() - allWeeksStart) / (CONFIG.weeksHistory * 7 * 24 * 3600 * 1000));

    // Session timestamp = random day in that week
    const weekEnd = addDays(weekStart, 6);

    for (const uid of userIds) {
        // 1. Insert Session (so data gatherer sees activity)
        await query(
            `INSERT INTO sessions (session_id, user_id, started_at, completed_at, duration_seconds)
             VALUES ($1, $2, $3, $3, 300)`,
            [randomUUID(), uid, weekStart] // Simply use weekStart as session time for simplicity
        );

        // 2. Update Latent States
        for (const factor of factors) {
            let base = 0.6; // normalized 0-1 usually? 
            let target = 0.6;
            // Note: Schema usually stores latent means as normalized floats? Or 0-100?
            // latent_states schema: mean FLOAT, variance FLOAT.
            // Check usage in codebase? Assuming 0-1 or 0-100.
            // seed_demo.ts used 0.1-1.0 range. So 0.6 is good.

            if (team.name === 'Engineering') {
                if (factor === 'workload') { base = 0.7; target = 0.2; } // Strain inc, score drops
                else { base = 0.6; target = 0.5; }
            } else if (team.name === 'Sales') {
                base = 0.6; target = 0.9;
            } else {
                base = 0.5; target = 0.55;
            }

            const rawScore = base + (target - base) * progress;
            const noise = ((Math.random() * team.volatility) - (team.volatility / 2)) / 100; // volatility is 20 -> 0.2
            let score = Math.max(0, Math.min(1, rawScore + noise));

            // variance
            const variance = 0.05;

            // Upsert latent state
            await query(
                `INSERT INTO latent_states (user_id, parameter, mean, variance, updated_at)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (user_id, parameter) DO UPDATE SET mean = $3, variance = $4, updated_at = $5`,
                [uid, factor, score, variance, weekStart]
            );
        }
    }
}

// Execute
main().catch(console.error);

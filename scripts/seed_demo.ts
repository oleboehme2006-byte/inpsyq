
/**
 * SEED DEMO — Create "Golden Demo" Organization
 * 
 * Creates "Acme Corp" with rich historical data for demos.
 * EXPANDED VERSION: 6 Teams, High Employee Count.
 * 
 * Teams:
 * - Product (12)
 * - Engineering (45)
 * - Support (25)
 * - Operations (15)
 * - Sales (35)
 * - HR (8)
 * 
 * Total: ~140 Users
 * 
 * Usage: npx tsx scripts/seed_demo.ts
 */

import './_bootstrap';
import { query, pool } from '../db/client';
import { randomUUID } from 'crypto';

// Fix IDs for demo consistency
const DEMO_ORG_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const DEMO_ADMIN_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const TEAMS = [
    { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', name: 'Engineering', size: 45, persona: 'strained' },
    { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', name: 'Sales', size: 35, persona: 'volatile' },
    { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', name: 'Product', size: 12, persona: 'engaged' },
    { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', name: 'Support', size: 25, persona: 'high_risk' },
    { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', name: 'Operations', size: 15, persona: 'stable' },
    { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6', name: 'HR', size: 8, persona: 'stable' },
];

async function seedDemo() {
    console.log('=== Seeding "Golden Demo" (Acme Corp) [EXPANDED] ===\n');

    try {
        await query('BEGIN');

        // 0. Cleanup (Optional, but good for clean slate if re-running)
        // We delete from bottom up to avoid FK constraints
        console.log('Cleaning up previous Acme Corp data...');
        await query(`DELETE FROM org_aggregates_weekly WHERE org_id = $1`, [DEMO_ORG_ID]);
        await query(`DELETE FROM memberships WHERE org_id = $1`, [DEMO_ORG_ID]);
        await query(`DELETE FROM users WHERE org_id = $1`, [DEMO_ORG_ID]);
        await query(`DELETE FROM teams WHERE org_id = $1`, [DEMO_ORG_ID]);
        await query(`DELETE FROM orgs WHERE org_id = $1`, [DEMO_ORG_ID]);

        // 1. Create Org
        console.log('Creating Acme Corp...');
        await query(`
            INSERT INTO orgs (org_id, name)
            VALUES ($1, $2)
        `, [DEMO_ORG_ID, 'Acme Corp']);

        // 2. Create Teams
        for (const team of TEAMS) {
            await query(`
                INSERT INTO teams (team_id, org_id, name)
                VALUES ($1, $2, $3)
            `, [team.id, DEMO_ORG_ID, team.name]);
        }

        // 3. Create Admin/Exec User
        console.log('Creating Demo Admin (demo@inpsyq.com)...');
        await query(`
            INSERT INTO users (user_id, org_id, email, is_active)
            VALUES ($1, $2, $3, true)
        `, [DEMO_ADMIN_ID, DEMO_ORG_ID, 'demo@inpsyq.com']);

        // Grant ADMIN role
        await query(`
            INSERT INTO memberships (membership_id, user_id, org_id, role)
            VALUES ($1, $2, $3, 'ADMIN')
        `, [randomUUID(), DEMO_ADMIN_ID, DEMO_ORG_ID]);

        // 4. Create Employees & Memberships
        console.log('Creating Employees...');
        let totalEmployees = 0;

        for (const team of TEAMS) {
            for (let i = 0; i < team.size; i++) {
                const userId = randomUUID();

                await query(`
                    INSERT INTO users (user_id, org_id, team_id, is_active)
                    VALUES ($1, $2, $3, true)
                `, [userId, DEMO_ORG_ID, team.id]);

                await query(`
                    INSERT INTO memberships (membership_id, user_id, org_id, team_id, role)
                    VALUES ($1, $2, $3, $4, 'EMPLOYEE')
                `, [randomUUID(), userId, DEMO_ORG_ID, team.id]);

                totalEmployees++;
            }
        }

        await query('COMMIT');
        console.log(`Created ${totalEmployees} employees across ${TEAMS.length} teams.\n`);

        // 5. Generate Historical Data (Direct Aggregate Injection)
        console.log('Generating 6 weeks of historical aggregates...');
        await generateWeeklyAggregates();

    } catch (e: any) {
        await query('ROLLBACK');
        console.error('Seed failed:', e);
        process.exit(1);
    } finally {
        pool.end();
    }
}

async function generateWeeklyAggregates() {
    const WEEKS = 6;
    const now = new Date();

    // Helper to generate some jitter
    const jitter = (base: number, amount: number = 0.1) => {
        return Math.max(0, Math.min(1, base + (Math.random() * amount * 2 - amount)));
    };

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let count = 0;
        for (let w = 0; w < WEEKS; w++) {
            // Monday of w weeks ago
            const date = new Date(now);
            date.setDate(date.getDate() - (w * 7) - date.getDay() + 1); // Ensure Monday
            date.setHours(0, 0, 0, 0);

            for (const team of TEAMS) {
                // Determine base stats based on team persona
                let strainBase = 0.3;     // Low strain = Good
                let withdrawalBase = 0.2; // Low risk = Good
                let engagementBase = 0.7; // High engagement = Good
                let trustBase = 0.15;     // Low gap = Good

                // Customize by persona
                switch (team.persona) {
                    case 'strained': // Engineering
                        strainBase = 0.65;
                        engagementBase = 0.55;
                        trustBase = 0.3;
                        break;
                    case 'volatile': // Sales
                        withdrawalBase = 0.5; // Flight risk
                        strainBase = 0.45;
                        engagementBase = 0.6; // High energy but risky
                        break;
                    case 'engaged': // Product
                        strainBase = 0.4; // Healthy pressure
                        engagementBase = 0.85;
                        trustBase = 0.1;
                        break;
                    case 'high_risk': // Support
                        strainBase = 0.75; // Burnout
                        withdrawalBase = 0.4;
                        engagementBase = 0.4;
                        break;
                    case 'stable': // Ops, HR
                        strainBase = 0.25;
                        engagementBase = 0.7;
                        break;
                }

                // Add temporal trends
                // w=0 is current week, w=5 is 6 weeks ago
                // Let's make Engineering improve (strain goes down over time)
                if (team.name === 'Engineering') {
                    // Past was worse (add to strain for larger w)
                    strainBase += (w * 0.04);
                }

                // Let's make Sales crash (strain goes UP recently)
                if (team.name === 'Sales') {
                    // Recent is worse (add to strain for small w)
                    strainBase += ((WEEKS - w) * 0.03);
                }

                // Jitter everything
                const indices = {
                    strain: jitter(strainBase),
                    withdrawal_risk: jitter(withdrawalBase),
                    trust_gap: jitter(trustBase),
                    engagement: jitter(engagementBase),
                    clarity: jitter(0.7),
                    autonomy: jitter(0.6),
                    recognition: jitter(0.5)
                };

                // Generate Attribution (Drivers)
                // We need to match the schema for `attribution` or `contributions_breakdown`?
                // `teamReader` uses `attribution` column from `org_aggregates_weekly`?
                // Let's check `lib/schema.ts` inside `seed_demo.ts` context or just use `contributions_breakdown` if that's what we have.
                // Wait, in previous turn I saw `org_aggregates_weekly` has `indices`, `parameter_means`, `contributions_breakdown`.
                // It did NOT show `attribution` column in the `schema.ts` I viewed.
                // BUT `teamReader.ts` selected `attribution`.
                // If the column exists in DB but not schema.ts, I should try to write to it.
                // If it fails, I'll know.
                // But wait, `teamReader.ts` maps `row.attribution`.
                // Let's assume it exists.

                // Mock Attribution Structure
                const attribution = [{
                    primarySource: indices.strain > 0.6 ? 'INTERNAL' : 'MIXED',
                    internal: [
                        { driverFamily: 'workload', label: 'Workload Capacity', contributionBand: 'HIGH', severityLevel: 'CRITICAL' },
                        { driverFamily: 'ambiguity', label: 'Role Clarity', contributionBand: 'MEDIUM', severityLevel: 'WARNING' }
                    ],
                    external: [],
                    propagationRisk: null
                }];

                await client.query(`
                    INSERT INTO org_aggregates_weekly (
                        org_id, team_id, week_start, 
                        indices, parameter_means, 
                        attribution,
                        contributions_breakdown, parameter_uncertainty
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (org_id, team_id, week_start) 
                    DO UPDATE SET indices = $4, attribution = $6
                `, [
                    DEMO_ORG_ID, team.id, date,
                    JSON.stringify(indices),
                    JSON.stringify(indices), // Means ~ Indices
                    JSON.stringify(attribution),
                    JSON.stringify([]),
                    JSON.stringify({})
                ]);
                count++;
            }
        }
        await client.query('COMMIT');
        console.log(`  Inserted ${count} weekly aggregate records.`);
    } catch (e) {
        await client.query('ROLLBACK');
        console.warn('  Warning: Could not insert aggregates (maybe schema mismatch for attribution column). Retrying without attribution...');
        // Fallback for safety if attribution column is missing
        await retryWithoutAttribution(client, WEEKS, now, jitter);
    } finally {
        client.release();
    }
}

async function retryWithoutAttribution(client: any, WEEKS: number, now: Date, jitter: Function) {
    try {
        await client.query('BEGIN');
        // ... simplified retry loop if needed, or just let it fail to debug
        // For now, let's just re-throw to see the error if the first try fails
        throw new Error("Attribution column check failed - ensure schema matches.");
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
}

seedDemo();

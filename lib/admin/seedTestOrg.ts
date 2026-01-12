/**
 * SEED TEST ORG — Idempotent Test Organization Seeding
 * 
 * Creates/ensures Test Organization with admin user and fake data.
 * Safe to run multiple times.
 */

import { query } from '@/db/client';
import { randomUUID } from 'crypto';
import { MEASUREMENT_SCHEMA_SQL } from '@/lib/measurement/schema';
import { INTERPRETATION_SCHEMA_SQL } from '@/lib/interpretation/schema';

// Constants
const TEST_ORG_SLUG = 'test-org';
const TEST_ORG_NAME = 'Test Organization';
const TEST_ADMIN_EMAIL = 'oleboehme2006@gmail.com';

const TEAM_NAMES = ['Alpha', 'Beta', 'Gamma'];
const EMPLOYEES_PER_TEAM = 5;

export interface TestOrgResult {
    orgId: string;
    userId: string;
    teamIds: string[];
}

export interface SeedResult {
    orgId: string;
    weeksSeeded: number;
    sessionsCreated: number;
    responsesCreated: number;
    interpretationsCreated: number;
}

/**
 * Ensure Test Organization and Admin user exist.
 * Idempotent: Safe to call multiple times.
 */
export async function ensureTestOrgAndAdmin(email: string = TEST_ADMIN_EMAIL): Promise<TestOrgResult> {
    // Ensure schemas exist
    try {
        await query(MEASUREMENT_SCHEMA_SQL);
        await query(INTERPRETATION_SCHEMA_SQL);
    } catch (e) {
        // Schemas might already exist
    }

    // 1. Ensure org exists (by slug/name)
    let orgId: string;
    const existingOrg = await query(
        `SELECT id FROM organizations WHERE name = $1`,
        [TEST_ORG_NAME]
    );

    if (existingOrg.rows.length > 0) {
        orgId = existingOrg.rows[0].id;
        console.log(`[SeedTestOrg] Org exists: ${orgId}`);
    } else {
        orgId = randomUUID();
        await query(
            `INSERT INTO organizations (id, name) VALUES ($1, $2)`,
            [orgId, TEST_ORG_NAME]
        );
        console.log(`[SeedTestOrg] Created org: ${orgId}`);
    }

    // 2. Ensure user exists
    let userId: string;
    const existingUser = await query(
        `SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)`,
        [email]
    );

    if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].user_id;
        console.log(`[SeedTestOrg] User exists: ${userId}`);
    } else {
        const userResult = await query(
            `INSERT INTO users (email, name) VALUES ($1, 'Test Admin') RETURNING user_id`,
            [email]
        );
        userId = userResult.rows[0].user_id;
        console.log(`[SeedTestOrg] Created user: ${userId}`);
    }

    // 3. Ensure ADMIN membership
    const existingMembership = await query(
        `SELECT membership_id FROM memberships WHERE user_id = $1 AND org_id = $2`,
        [userId, orgId]
    );

    if (existingMembership.rows.length > 0) {
        // Update to ADMIN if not already
        await query(
            `UPDATE memberships SET role = 'ADMIN' WHERE user_id = $1 AND org_id = $2`,
            [userId, orgId]
        );
        console.log(`[SeedTestOrg] Membership updated to ADMIN`);
    } else {
        await query(
            `INSERT INTO memberships (user_id, org_id, role) VALUES ($1, $2, 'ADMIN')`,
            [userId, orgId, 'ADMIN']
        );
        console.log(`[SeedTestOrg] Created ADMIN membership`);
    }

    // 4. Ensure teams exist
    const teamIds: string[] = [];
    for (const teamName of TEAM_NAMES) {
        const existingTeam = await query(
            `SELECT team_id FROM teams WHERE org_id = $1 AND name = $2`,
            [orgId, teamName]
        );

        if (existingTeam.rows.length > 0) {
            teamIds.push(existingTeam.rows[0].team_id);
        } else {
            const teamResult = await query(
                `INSERT INTO teams (org_id, name) VALUES ($1, $2) RETURNING team_id`,
                [orgId, teamName]
            );
            teamIds.push(teamResult.rows[0].team_id);
            console.log(`[SeedTestOrg] Created team: ${teamName}`);
        }
    }

    return { orgId, userId, teamIds };
}

/**
 * Seed fake measurement data for Test Organization.
 * Idempotent: Skips weeks that already have data.
 */
export async function seedTestOrgData(
    orgId: string,
    weeks: number = 6,
    seed: number = 42
): Promise<SeedResult> {
    // Seeded random for determinism
    const rng = createSeededRng(seed);

    let sessionsCreated = 0;
    let responsesCreated = 0;
    let interpretationsCreated = 0;

    // Get teams for this org
    const teamsResult = await query(
        `SELECT team_id, name FROM teams WHERE org_id = $1`,
        [orgId]
    );
    const teams = teamsResult.rows;

    if (teams.length === 0) {
        throw new Error('No teams found for org. Run ensureTestOrgAndAdmin first.');
    }

    // Ensure we have employees per team
    for (const team of teams) {
        const existingEmployees = await query(
            `SELECT user_id FROM memberships WHERE org_id = $1 AND team_id = $2 AND role = 'EMPLOYEE'`,
            [orgId, team.team_id]
        );

        const neededEmployees = EMPLOYEES_PER_TEAM - existingEmployees.rows.length;
        for (let i = 0; i < neededEmployees; i++) {
            const employeeEmail = `employee-${team.name.toLowerCase()}-${i}@test-org.local`;

            // Check if user exists
            const existingUser = await query(
                `SELECT user_id FROM users WHERE email = $1`,
                [employeeEmail]
            );

            let employeeUserId: string;
            if (existingUser.rows.length > 0) {
                employeeUserId = existingUser.rows[0].user_id;
            } else {
                const userResult = await query(
                    `INSERT INTO users (email, name) VALUES ($1, $2) RETURNING user_id`,
                    [employeeEmail, `${team.name} Employee ${i + 1}`]
                );
                employeeUserId = userResult.rows[0].user_id;
            }

            // Check if membership exists
            const existingMem = await query(
                `SELECT membership_id FROM memberships WHERE user_id = $1 AND org_id = $2`,
                [employeeUserId, orgId]
            );

            if (existingMem.rows.length === 0) {
                await query(
                    `INSERT INTO memberships (user_id, org_id, team_id, role) VALUES ($1, $2, $3, 'EMPLOYEE')`,
                    [employeeUserId, orgId, team.team_id]
                );
            }
        }
    }

    // Calculate week starts (going back from current week)
    const weekStarts = getWeekStarts(weeks);

    for (const weekStart of weekStarts) {
        // Check if this week already has data
        const existingData = await query(
            `SELECT COUNT(*) as cnt FROM measurement_sessions 
             WHERE org_id = $1 AND week_start = $2`,
            [orgId, weekStart]
        );

        if (parseInt(existingData.rows[0].cnt) > 0) {
            console.log(`[SeedTestOrg] Week ${weekStart} already has data, skipping`);
            continue;
        }

        // Get all employees in this org
        const employees = await query(
            `SELECT u.user_id, m.team_id 
             FROM users u 
             JOIN memberships m ON u.user_id = m.user_id 
             WHERE m.org_id = $1 AND m.role = 'EMPLOYEE'`,
            [orgId]
        );

        // Create sessions and responses
        for (const emp of employees.rows) {
            const sessionId = randomUUID();

            await query(
                `INSERT INTO measurement_sessions 
                 (session_id, user_id, org_id, team_id, week_start, status, started_at, completed_at)
                 VALUES ($1, $2, $3, $4, $5, 'COMPLETED', $6, $6)`,
                [sessionId, emp.user_id, orgId, emp.team_id, weekStart, new Date(weekStart)]
            );
            sessionsCreated++;

            // Create 10-15 responses per session
            const numResponses = 10 + Math.floor(rng() * 6);
            for (let i = 0; i < numResponses; i++) {
                const itemId = `item_${i + 1}`;
                const value = 3 + rng() * 4; // Values between 3-7

                await query(
                    `INSERT INTO measurement_responses 
                     (session_id, user_id, item_id, numeric_value)
                     VALUES ($1, $2, $3, $4)`,
                    [sessionId, emp.user_id, itemId, value]
                );
                responsesCreated++;
            }

            // Create quality metrics
            await query(
                `INSERT INTO measurement_quality 
                 (session_id, completion_rate, response_time_ms, missing_items, confidence_proxy)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (session_id) DO NOTHING`,
                [sessionId, 0.95 + rng() * 0.05, 30000 + Math.floor(rng() * 20000), 0, 0.8 + rng() * 0.2]
            );
        }

        // Create interpretation for each team
        for (const team of teams) {
            const existingInterp = await query(
                `SELECT id FROM weekly_interpretations 
                 WHERE org_id = $1 AND team_id = $2 AND week_start = $3 AND is_active = true`,
                [orgId, team.team_id, weekStart]
            );

            if (existingInterp.rows.length === 0) {
                const sectionsJson = generateFakeInterpretation(team.name, weekStart, rng);
                await query(
                    `INSERT INTO weekly_interpretations 
                     (org_id, team_id, week_start, input_hash, model_id, prompt_version, sections_json, is_active)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
                    [orgId, team.team_id, weekStart, `seed-${seed}`, 'test-model', 'v1.0', JSON.stringify(sectionsJson)]
                );
                interpretationsCreated++;
            }
        }

        // Create org-level interpretation
        const existingOrgInterp = await query(
            `SELECT id FROM weekly_interpretations 
             WHERE org_id = $1 AND team_id IS NULL AND week_start = $2 AND is_active = true`,
            [orgId, weekStart]
        );

        if (existingOrgInterp.rows.length === 0) {
            const sectionsJson = generateFakeInterpretation('Organization', weekStart, rng);
            await query(
                `INSERT INTO weekly_interpretations 
                 (org_id, team_id, week_start, input_hash, model_id, prompt_version, sections_json, is_active)
                 VALUES ($1, NULL, $2, $3, $4, $5, $6, true)`,
                [orgId, weekStart, `seed-${seed}`, 'test-model', 'v1.0', JSON.stringify(sectionsJson)]
            );
            interpretationsCreated++;
        }

        console.log(`[SeedTestOrg] Seeded week ${weekStart}`);
    }

    return {
        orgId,
        weeksSeeded: weeks,
        sessionsCreated,
        responsesCreated,
        interpretationsCreated,
    };
}

/**
 * Get status of Test Organization data.
 */
export async function getTestOrgStatus(): Promise<{
    exists: boolean;
    orgId?: string;
    teamCount: number;
    employeeCount: number;
    weekCount: number;
    sessionCount: number;
    interpretationCount: number;
}> {
    const orgResult = await query(
        `SELECT id FROM organizations WHERE name = $1`,
        [TEST_ORG_NAME]
    );

    if (orgResult.rows.length === 0) {
        return { exists: false, teamCount: 0, employeeCount: 0, weekCount: 0, sessionCount: 0, interpretationCount: 0 };
    }

    const orgId = orgResult.rows[0].id;

    const [teams, employees, weeks, sessions, interpretations] = await Promise.all([
        query(`SELECT COUNT(*) as cnt FROM teams WHERE org_id = $1`, [orgId]),
        query(`SELECT COUNT(*) as cnt FROM memberships WHERE org_id = $1 AND role = 'EMPLOYEE'`, [orgId]),
        query(`SELECT COUNT(DISTINCT week_start) as cnt FROM measurement_sessions WHERE org_id = $1`, [orgId]),
        query(`SELECT COUNT(*) as cnt FROM measurement_sessions WHERE org_id = $1`, [orgId]),
        query(`SELECT COUNT(*) as cnt FROM weekly_interpretations WHERE org_id = $1`, [orgId]),
    ]);

    return {
        exists: true,
        orgId,
        teamCount: parseInt(teams.rows[0].cnt),
        employeeCount: parseInt(employees.rows[0].cnt),
        weekCount: parseInt(weeks.rows[0].cnt),
        sessionCount: parseInt(sessions.rows[0].cnt),
        interpretationCount: parseInt(interpretations.rows[0].cnt),
    };
}

// Helpers

function createSeededRng(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

function getWeekStarts(weeks: number): string[] {
    const result: string[] = [];
    const now = new Date();

    // Get Monday of current week
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = new Date(monday);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        result.push(weekStart.toISOString().slice(0, 10));
    }

    return result;
}

function generateFakeInterpretation(entityName: string, weekStart: string, rng: () => number): object {
    const score = 60 + Math.floor(rng() * 30);
    const trend = rng() > 0.5 ? 'improving' : 'stable';

    return {
        summary: `${entityName} shows ${trend} trends for week of ${weekStart}. Overall engagement score: ${score}%.`,
        highlights: [
            'Team collaboration remains strong',
            'Communication patterns are healthy',
            'Workload distribution is balanced',
        ],
        concerns: rng() > 0.7 ? ['Minor stress indicators detected'] : [],
        recommendations: [
            'Continue current practices',
            'Schedule regular check-ins',
        ],
        metrics: {
            engagement: score,
            wellbeing: 65 + Math.floor(rng() * 25),
            collaboration: 70 + Math.floor(rng() * 20),
        },
    };
}

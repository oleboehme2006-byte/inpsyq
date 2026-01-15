/**
 * SEED TEST ORG — Idempotent Test Organization Seeding
 * 
 * Creates/ensures Test Organization with admin user and fake data.
 * Safe to run multiple times.
 * 
 * PHASE 36.7d: Uses dedicated TEST_ORG_ID to avoid fixture collisions.
 * Prunes to canonical counts: 3 teams, 15 employees.
 */

import { query } from '@/db/client';
import { randomUUID } from 'crypto';
import { MEASUREMENT_SCHEMA_SQL } from '@/lib/measurement/schema';
import { INTERPRETATION_SCHEMA_SQL } from '@/lib/interpretation/schema';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS — Dedicated Test Org Configuration
// ═══════════════════════════════════════════════════════════════════════════

/** Dedicated UUID for test org - MUST NOT collide with fixture IDs */
export const TEST_ORG_ID = '99999999-9999-4999-8999-999999999999';

/** Known fixture IDs that must never be used */
const FIXTURE_ORG_IDS = [
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
];

const TEST_ORG_NAME = 'Test Organization';
const TEST_ADMIN_EMAIL = 'oleboehme2006@gmail.com';

/** Canonical team names - exactly 3 */
const CANONICAL_TEAM_NAMES = ['Alpha', 'Beta', 'Gamma'] as const;
const EMPLOYEES_PER_TEAM = 5;

/** Generate canonical employee email */
function getCanonicalEmployeeEmail(teamName: string, index: number): string {
    return `employee-${teamName.toLowerCase()}-${index}@test-org.local`;
}

/** Get all canonical employee emails */
function getAllCanonicalEmployeeEmails(): string[] {
    const emails: string[] = [];
    for (const team of CANONICAL_TEAM_NAMES) {
        for (let i = 0; i < EMPLOYEES_PER_TEAM; i++) {
            emails.push(getCanonicalEmployeeEmail(team, i));
        }
    }
    return emails;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface TestOrgResult {
    orgId: string;
    userId: string;
    teamIds: string[];
    pruneReport?: PruneReport;
}

export interface SeedResult {
    orgId: string;
    weeksSeeded: number;
    sessionsCreated: number;
    responsesCreated: number;
    interpretationsCreated: number;
}

export interface PruneReport {
    removedTeams: number;
    removedMemberships: number;
    ensuredTeams: number;
    ensuredEmployees: number;
}

export interface TestOrgStatus {
    exists: boolean;
    orgId?: string;
    isCanonicalId: boolean;
    totalTeamCount: number;
    managedTeamCount: number;
    totalEmployeeCount: number;
    managedEmployeeCount: number;
    weekCount: number;
    sessionCount: number;
    interpretationCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRUNE FUNCTION — Enforce Canonical Counts
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Prune test org to canonical state: exactly 3 teams, 15 employees.
 * Only operates on the dedicated TEST_ORG_ID.
 */
export async function pruneTestOrgToCanonical(orgId: string): Promise<PruneReport> {
    // Safety: Only prune the dedicated test org
    if (orgId !== TEST_ORG_ID) {
        console.log(`[SeedTestOrg] PRUNE SKIPPED: orgId ${orgId} is not TEST_ORG_ID`);
        return { removedTeams: 0, removedMemberships: 0, ensuredTeams: 0, ensuredEmployees: 0 };
    }

    let removedTeams = 0;
    let removedMemberships = 0;
    let ensuredTeams = 0;
    let ensuredEmployees = 0;

    // ─────────────────────────────────────────────────────────────────────────
    // Step 1: Prune teams not in canonical list
    // ─────────────────────────────────────────────────────────────────────────
    const teamsToRemove = await query(
        `SELECT team_id, name FROM teams WHERE org_id = $1 AND name NOT IN ($2, $3, $4)`,
        [orgId, ...CANONICAL_TEAM_NAMES]
    );

    for (const team of teamsToRemove.rows) {
        // First delete memberships for this team
        await query(`DELETE FROM memberships WHERE team_id = $1`, [team.team_id]);
        // Then delete the team
        await query(`DELETE FROM teams WHERE team_id = $1`, [team.team_id]);
        removedTeams++;
        console.log(`[SeedTestOrg] PRUNE: Removed team ${team.name}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2: Ensure canonical teams exist
    // ─────────────────────────────────────────────────────────────────────────
    for (const teamName of CANONICAL_TEAM_NAMES) {
        const existing = await query(
            `SELECT team_id FROM teams WHERE org_id = $1 AND name = $2`,
            [orgId, teamName]
        );

        if (existing.rows.length === 0) {
            await query(
                `INSERT INTO teams (org_id, name) VALUES ($1, $2)`,
                [orgId, teamName]
            );
            ensuredTeams++;
            console.log(`[SeedTestOrg] PRUNE: Ensured team ${teamName}`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 3: Prune non-canonical employee memberships
    // ─────────────────────────────────────────────────────────────────────────
    const canonicalEmails = getAllCanonicalEmployeeEmails();

    // Get all EMPLOYEE memberships in this org
    const allEmployeeMemberships = await query(
        `SELECT m.membership_id, u.email, u.user_id
         FROM memberships m
         JOIN users u ON m.user_id = u.user_id
         WHERE m.org_id = $1 AND m.role = 'EMPLOYEE'`,
        [orgId]
    );

    for (const mem of allEmployeeMemberships.rows) {
        if (!canonicalEmails.includes(mem.email.toLowerCase())) {
            await query(`DELETE FROM memberships WHERE membership_id = $1`, [mem.membership_id]);
            removedMemberships++;
            console.log(`[SeedTestOrg] PRUNE: Removed membership for ${mem.email}`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 4: Ensure canonical employees exist with correct team assignments
    // ─────────────────────────────────────────────────────────────────────────
    for (const teamName of CANONICAL_TEAM_NAMES) {
        // Get team ID
        const teamResult = await query(
            `SELECT team_id FROM teams WHERE org_id = $1 AND name = $2`,
            [orgId, teamName]
        );
        const teamId = teamResult.rows[0]?.team_id;
        if (!teamId) continue;

        for (let i = 0; i < EMPLOYEES_PER_TEAM; i++) {
            const email = getCanonicalEmployeeEmail(teamName, i);
            const name = `${teamName} Employee ${i + 1}`;

            // Ensure user exists
            let userId: string;
            const existingUser = await query(
                `SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)`,
                [email]
            );

            if (existingUser.rows.length > 0) {
                userId = existingUser.rows[0].user_id;
            } else {
                const userResult = await query(
                    `INSERT INTO users (email, name) VALUES ($1, $2) RETURNING user_id`,
                    [email, name]
                );
                userId = userResult.rows[0].user_id;
                ensuredEmployees++;
            }

            // Ensure membership exists with correct team
            const existingMem = await query(
                `SELECT membership_id, team_id FROM memberships WHERE user_id = $1 AND org_id = $2`,
                [userId, orgId]
            );

            if (existingMem.rows.length === 0) {
                await query(
                    `INSERT INTO memberships (user_id, org_id, team_id, role) VALUES ($1, $2, $3, 'EMPLOYEE')`,
                    [userId, orgId, teamId]
                );
                ensuredEmployees++;
            } else if (existingMem.rows[0].team_id !== teamId) {
                // Wrong team - update it
                await query(
                    `UPDATE memberships SET team_id = $1 WHERE membership_id = $2`,
                    [teamId, existingMem.rows[0].membership_id]
                );
            }
        }
    }

    console.log(`[SeedTestOrg] PRUNE COMPLETE: removed ${removedTeams} teams, ${removedMemberships} memberships; ensured ${ensuredTeams} teams, ${ensuredEmployees} employees`);

    return { removedTeams, removedMemberships, ensuredTeams, ensuredEmployees };
}

// ═══════════════════════════════════════════════════════════════════════════
// ENSURE FUNCTION — Create/Ensure Test Org
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ensure Test Organization and Admin user exist.
 * Idempotent: Safe to call multiple times.
 * Uses dedicated TEST_ORG_ID and prunes to canonical state.
 */
export async function ensureTestOrgAndAdmin(email: string = TEST_ADMIN_EMAIL): Promise<TestOrgResult> {
    // Ensure schemas exist
    try {
        await query(MEASUREMENT_SCHEMA_SQL);
        await query(INTERPRETATION_SCHEMA_SQL);
    } catch (e) {
        // Schemas might already exist
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 1: Ensure org exists with dedicated TEST_ORG_ID
    // ─────────────────────────────────────────────────────────────────────────
    const existingOrg = await query(
        `SELECT org_id FROM orgs WHERE org_id = $1`,
        [TEST_ORG_ID]
    );

    if (existingOrg.rows.length > 0) {
        console.log(`[SeedTestOrg] Org exists: ${TEST_ORG_ID}`);
    } else {
        await query(
            `INSERT INTO orgs (org_id, name) VALUES ($1, $2)`,
            [TEST_ORG_ID, TEST_ORG_NAME]
        );
        console.log(`[SeedTestOrg] Created org: ${TEST_ORG_ID}`);
    }

    const orgId = TEST_ORG_ID;

    // Verify org exists before proceeding (FK check)
    const orgVerify = await query(`SELECT org_id FROM orgs WHERE org_id = $1`, [orgId]);
    if (orgVerify.rows.length === 0) {
        throw new Error(`SCHEMA_ERROR: Org ${orgId} not found after insert. Check orgs table schema.`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2: Ensure admin user exists
    // ─────────────────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────────────────
    // Step 3: Ensure ADMIN membership
    // ─────────────────────────────────────────────────────────────────────────
    const existingMembership = await query(
        `SELECT membership_id FROM memberships WHERE user_id = $1 AND org_id = $2`,
        [userId, orgId]
    );

    if (existingMembership.rows.length > 0) {
        await query(
            `UPDATE memberships SET role = 'ADMIN' WHERE user_id = $1 AND org_id = $2`,
            [userId, orgId]
        );
        console.log(`[SeedTestOrg] Membership updated to ADMIN`);
    } else {
        await query(
            `INSERT INTO memberships (user_id, org_id, role) VALUES ($1, $2, $3)`,
            [userId, orgId, 'ADMIN']
        );
        console.log(`[SeedTestOrg] Created ADMIN membership`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 4: Prune to canonical state (3 teams, 15 employees)
    // ─────────────────────────────────────────────────────────────────────────
    const pruneReport = await pruneTestOrgToCanonical(orgId);

    // ─────────────────────────────────────────────────────────────────────────
    // Step 5: Get final team IDs
    // ─────────────────────────────────────────────────────────────────────────
    const teamIds: string[] = [];
    for (const teamName of CANONICAL_TEAM_NAMES) {
        const result = await query(
            `SELECT team_id FROM teams WHERE org_id = $1 AND name = $2`,
            [orgId, teamName]
        );
        if (result.rows.length > 0) {
            teamIds.push(result.rows[0].team_id);
        }
    }

    return { orgId, userId, teamIds, pruneReport };
}

// ═══════════════════════════════════════════════════════════════════════════
// SEED FUNCTION — Create Fake Measurement Data
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Seed fake measurement data for Test Organization.
 * Idempotent: Skips weeks that already have data.
 */
export async function seedTestOrgData(
    orgId: string,
    weeks: number = 6,
    seed: number = 42
): Promise<SeedResult> {
    // Safety check: must be the dedicated test org
    if (orgId !== TEST_ORG_ID) {
        throw new Error(`SAFETY_ERROR: Cannot seed org ${orgId}. Only TEST_ORG_ID is allowed.`);
    }

    const rng = createSeededRng(seed);

    let sessionsCreated = 0;
    let responsesCreated = 0;
    let interpretationsCreated = 0;

    // Get canonical teams for this org
    const teamsResult = await query(
        `SELECT team_id, name FROM teams WHERE org_id = $1 AND name IN ($2, $3, $4)`,
        [orgId, ...CANONICAL_TEAM_NAMES]
    );
    const teams = teamsResult.rows;

    if (teams.length !== 3) {
        throw new Error(`Expected 3 canonical teams, found ${teams.length}. Run ensureTestOrgAndAdmin first.`);
    }

    // Calculate week starts (going back from current week)
    const weekStarts = getWeekStarts(weeks);

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 36.7e: Get canonical synthetic employee user_ids upfront
    // These are the ONLY users we will pre-delete sessions for (safe boundary)
    // ─────────────────────────────────────────────────────────────────────────
    const canonicalEmails = getAllCanonicalEmployeeEmails();
    const syntheticUsersResult = await query(
        `SELECT user_id, email FROM users WHERE LOWER(email) = ANY($1::text[])`,
        [canonicalEmails.map(e => e.toLowerCase())]
    );

    const syntheticUserIds = syntheticUsersResult.rows.map(r => r.user_id);

    if (syntheticUserIds.length !== 15) {
        throw new Error(`Expected 15 canonical synthetic users, found ${syntheticUserIds.length}. Run ensureTestOrgAndAdmin first.`);
    }

    console.log(`[SeedTestOrg] Found ${syntheticUserIds.length} canonical synthetic users`);

    for (const weekStart of weekStarts) {
        // ─────────────────────────────────────────────────────────────────────
        // PHASE 36.7e: Safe pre-delete for synthetic users only
        // This handles the global unique constraint (user_id, week_start)
        // by clearing any stale sessions before inserting new ones.
        // SAFETY: Only deletes rows where user_id is in canonical synthetic set.
        // ─────────────────────────────────────────────────────────────────────

        // Step 1: Delete dependent measurement_quality rows
        await query(
            `DELETE FROM measurement_quality WHERE session_id IN (
                SELECT session_id FROM measurement_sessions 
                WHERE user_id = ANY($1::uuid[]) AND week_start = $2
            )`,
            [syntheticUserIds, weekStart]
        );

        // Step 2: Delete dependent measurement_responses rows
        await query(
            `DELETE FROM measurement_responses WHERE session_id IN (
                SELECT session_id FROM measurement_sessions 
                WHERE user_id = ANY($1::uuid[]) AND week_start = $2
            )`,
            [syntheticUserIds, weekStart]
        );

        // Step 3: Delete stale measurement_sessions
        const deleteResult = await query(
            `DELETE FROM measurement_sessions 
             WHERE user_id = ANY($1::uuid[]) AND week_start = $2
             RETURNING session_id`,
            [syntheticUserIds, weekStart]
        );

        if (deleteResult.rows.length > 0) {
            console.log(`[SeedTestOrg] Pre-deleted ${deleteResult.rows.length} stale sessions for week ${weekStart}`);
        }

        // Get canonical employees in this org (with team assignment)
        const employees = await query(
            `SELECT u.user_id, m.team_id 
             FROM users u 
             JOIN memberships m ON u.user_id = m.user_id 
             WHERE m.org_id = $1 AND m.role = 'EMPLOYEE' AND u.user_id = ANY($2::uuid[])`,
            [orgId, syntheticUserIds]
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
                const value = 3 + rng() * 4;

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

// ═══════════════════════════════════════════════════════════════════════════
// STATUS FUNCTION — Get Test Org Status
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get status of Test Organization data.
 * Reports both total and managed (canonical) counts.
 */
export async function getTestOrgStatus(): Promise<TestOrgStatus> {
    // Always use dedicated TEST_ORG_ID
    const orgResult = await query(
        `SELECT org_id FROM orgs WHERE org_id = $1`,
        [TEST_ORG_ID]
    );

    if (orgResult.rows.length === 0) {
        return {
            exists: false,
            isCanonicalId: false,
            totalTeamCount: 0,
            managedTeamCount: 0,
            totalEmployeeCount: 0,
            managedEmployeeCount: 0,
            weekCount: 0,
            sessionCount: 0,
            interpretationCount: 0,
        };
    }

    const orgId = TEST_ORG_ID;
    const canonicalEmails = getAllCanonicalEmployeeEmails();

    const [
        totalTeams,
        managedTeams,
        totalEmployees,
        managedEmployees,
        weeks,
        sessions,
        interpretations,
    ] = await Promise.all([
        query(`SELECT COUNT(*) as cnt FROM teams WHERE org_id = $1`, [orgId]),
        query(
            `SELECT COUNT(*) as cnt FROM teams WHERE org_id = $1 AND name IN ($2, $3, $4)`,
            [orgId, ...CANONICAL_TEAM_NAMES]
        ),
        query(`SELECT COUNT(*) as cnt FROM memberships WHERE org_id = $1 AND role = 'EMPLOYEE'`, [orgId]),
        query(
            `SELECT COUNT(*) as cnt 
             FROM memberships m 
             JOIN users u ON m.user_id = u.user_id 
             WHERE m.org_id = $1 AND m.role = 'EMPLOYEE' AND LOWER(u.email) = ANY($2::text[])`,
            [orgId, canonicalEmails.map(e => e.toLowerCase())]
        ),
        query(`SELECT COUNT(DISTINCT week_start) as cnt FROM measurement_sessions WHERE org_id = $1`, [orgId]),
        query(`SELECT COUNT(*) as cnt FROM measurement_sessions WHERE org_id = $1`, [orgId]),
        query(`SELECT COUNT(*) as cnt FROM weekly_interpretations WHERE org_id = $1`, [orgId]),
    ]);

    return {
        exists: true,
        orgId,
        isCanonicalId: true,
        totalTeamCount: parseInt(totalTeams.rows[0].cnt),
        managedTeamCount: parseInt(managedTeams.rows[0].cnt),
        totalEmployeeCount: parseInt(totalEmployees.rows[0].cnt),
        managedEmployeeCount: parseInt(managedEmployees.rows[0].cnt),
        weekCount: parseInt(weeks.rows[0].cnt),
        sessionCount: parseInt(sessions.rows[0].cnt),
        interpretationCount: parseInt(interpretations.rows[0].cnt),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

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

/** Check if an org ID is a known fixture ID (should never be used for test org) */
export function isFixtureOrgId(orgId: string): boolean {
    return FIXTURE_ORG_IDS.includes(orgId);
}

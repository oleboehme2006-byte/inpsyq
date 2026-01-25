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
import { randomUUID, createHash } from 'crypto';
import { MEASUREMENT_SCHEMA_SQL } from '@/lib/measurement/schema';
import { INTERPRETATION_SCHEMA_SQL } from '@/lib/interpretation/schema';

/**
 * Deterministic UUID Generator (UUIDv5-like)
 * Generates a stable UUID based on a namespace and key.
 * Uses SHA-1 per RFC 4122 (simplified for verification stability).
 */
function getStableUUID(namespace: string, key: string): string {
    const input = `${namespace}:${key}`;
    const hash = createHash('sha1').update(input).digest('hex');
    // Format as UUID: 8-4-4-4-12
    return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

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

const TEST_ORG_NAME = 'InPsyq Demo Org';
const TEST_ADMIN_EMAIL = 'oleboehme2006@gmail.com';

/** Canonical team names - exactly 3 */
const CANONICAL_TEAM_NAMES = ['Engineering', 'Product', 'Design'] as const;
const EMPLOYEES_PER_TEAM = 5;

/** Generate canonical employee email */
function getCanonicalEmployeeEmail(teamName: string, index: number): string {
    return `employee-${teamName.toLowerCase()}-${index}@inpsyq.demo`;
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
        console.log(`[SeedTestOrg] PRUNE: Cleaning up team ${team.name} (${team.team_id})...`);

        // 1. Memberships
        await query(`DELETE FROM memberships WHERE team_id = $1`, [team.team_id]);

        // 2. Interpretations
        await query(`DELETE FROM weekly_interpretations WHERE team_id = $1`, [team.team_id]);

        // 3. Org Aggregates (Products)
        await query(`DELETE FROM org_aggregates_weekly WHERE team_id = $1`, [team.team_id]);

        // 4. Audit Events
        await query(`DELETE FROM audit_events WHERE team_id = $1`, [team.team_id]);

        // 5. Sessions (and cascade to responses/quality)
        // Need to delete sessions linked to this team
        await query(`DELETE FROM measurement_quality WHERE session_id IN (SELECT session_id FROM measurement_sessions WHERE team_id = $1)`, [team.team_id]);
        await query(`DELETE FROM measurement_responses WHERE session_id IN (SELECT session_id FROM measurement_sessions WHERE team_id = $1)`, [team.team_id]);
        await query(`DELETE FROM measurement_sessions WHERE team_id = $1`, [team.team_id]);

        // Finally delete the team
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
        if (existingMembership.rows[0].role !== 'ADMIN') {
            await query(
                `UPDATE memberships SET role = 'ADMIN' WHERE user_id = $1 AND org_id = $2`,
                [userId, orgId]
            );
            console.log(`[SeedTestOrg] Membership upgraded to ADMIN`);
        }
    } else {
        await query(
            `INSERT INTO memberships (user_id, org_id, role) VALUES ($1, $2, 'ADMIN')`,
            [userId, orgId]
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
    weeks: number = 12,
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
            // Stable Session ID: user:week
            const sessionId = getStableUUID('session', `${emp.user_id}:${weekStart}`);

            await query(
                `INSERT INTO measurement_sessions 
                 (session_id, user_id, org_id, team_id, week_start, status, started_at, completed_at)
                 VALUES ($1, $2, $3, $4, $5, 'COMPLETED', $6, $6)
                 ON CONFLICT (session_id) DO NOTHING`,
                [sessionId, emp.user_id, orgId, emp.team_id, weekStart, new Date(weekStart)]
            );
            sessionsCreated++;

            // Create 10-15 responses per session (Deterministic count and values based on seed)
            // Reset RNG for this session to ensure stability
            const sessionRng = createSeededRng(seed + sessionId.charCodeAt(0));

            const numResponses = 10 + Math.floor(sessionRng() * 6);
            for (let i = 0; i < numResponses; i++) {
                const itemId = `item_${i + 1}`;
                const value = 3 + sessionRng() * 4;

                await query(
                    `INSERT INTO measurement_responses 
                     (session_id, user_id, item_id, numeric_value)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (session_id, item_id) DO UPDATE SET numeric_value = EXCLUDED.numeric_value`,
                    [sessionId, emp.user_id, itemId, value]
                );
                responsesCreated++;
            }

            // Create quality metrics
            await query(
                `INSERT INTO measurement_quality 
                 (session_id, completion_rate, response_time_ms, missing_items, confidence_proxy)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (session_id) DO UPDATE 
                 SET completion_rate = EXCLUDED.completion_rate, response_time_ms = EXCLUDED.response_time_ms`,
                [sessionId, 0.95 + sessionRng() * 0.05, 30000 + Math.floor(sessionRng() * 20000), 0, 0.8 + sessionRng() * 0.2]
            );
        }

        // Create interpretation for each team
        for (const team of teams) {
            const sectionsJson = generateFakeInterpretation(team.name, weekStart, rng);
            // Stable ID for interpretation is not strictly required by schema (SERIALPK or UUID?)
            // Schema likely uses UUID or SERIAL. Let's assume auto-generated for now OR check schema.
            // If we want idempotency on INSERT without conflict, we need to check existence (which we do above).
            // But to be cleaner, we can try to find and update or insert.
            // The previous logic checked `is_active = true`.

            // For idempotency, we'll DELETE/RE-INSERT in the loop logic or UPSERT if we had a stable ID.
            // Since interpretations likely generate a new ID, let's look at the existing check.

            const existingInterp = await query(
                `SELECT id FROM weekly_interpretations 
                 WHERE org_id = $1 AND team_id = $2 AND week_start = $3 AND is_active = true`,
                [orgId, team.team_id, weekStart]
            );

            if (existingInterp.rows.length === 0) {
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

        // ─────────────────────────────────────────────────────────────────────
        // Create org_aggregates_weekly (pipeline products) for health snapshot
        // This makes health checks show teams as "OK" rather than "missing products"
        // ─────────────────────────────────────────────────────────────────────
        for (const team of teams) {
            await query(
                `INSERT INTO org_aggregates_weekly 
                 (org_id, team_id, week_start, parameter_means, parameter_uncertainty, indices, contributions_breakdown)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (org_id, team_id, week_start) DO UPDATE 
                 SET parameter_means = EXCLUDED.parameter_means`, // Idempotent Upsert
                [
                    orgId,
                    team.team_id,
                    weekStart,
                    JSON.stringify({ strain: 50 + rng() * 20, engagement: 60 + rng() * 20 }),
                    JSON.stringify({ strain: 5, engagement: 5 }),
                    JSON.stringify({
                        strain: { value: 50 + rng() * 20, state: 'NORMAL' },
                        withdrawal_risk: { value: 30 + rng() * 20, state: 'NORMAL' },
                        trust_gap: { value: 35 + rng() * 15, state: 'NORMAL' },
                        engagement: { value: 65 + rng() * 15, state: 'NORMAL' }
                    }),
                    JSON.stringify({})
                ]
            );
        }

        console.log(`[SeedTestOrg] Seeded week ${weekStart}`);

        // ─────────────────────────────────────────────────────────────────────
        // Create Alerts (system/alerts)
        // ─────────────────────────────────────────────────────────────────────
        if (rng() > 0.7) {
            // Randomly create an alert for this week
            const alertTypes = ['PARTICIPATION_DROP', 'MODEL_DRIFT', 'ANOMALY_DETECTED'];
            const alertType = alertTypes[Math.floor(rng() * alertTypes.length)];
            const severity = rng() > 0.5 ? 'critical' : 'warning';

            // Stable Alert ID
            const alertId = getStableUUID('alert', `${weekStart}:${alertType}`);

            await query(
                `INSERT INTO alerts 
                 (alert_id, org_id, alert_type, severity, message, target_week_start, details, created_at, resolved_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (alert_id) DO NOTHING`,
                [
                    alertId,
                    orgId,
                    alertType,
                    severity,
                    `Simulated ${alertType} for week ${weekStart}`,
                    weekStart,
                    JSON.stringify({ affected_teams: teams.map(t => t.name).slice(0, 1) }),
                    new Date(weekStart).toISOString(),
                    rng() > 0.5 ? new Date(new Date(weekStart).getTime() + 86400000).toISOString() : null // 50% resolved
                ]
            );
        }

        // ─────────────────────────────────────────────────────────────────────
        // Create Audit Logs (audit/team-contributions)
        // ─────────────────────────────────────────────────────────────────────
        // 1. Weekly Run Success
        // Stable ID not strictly needed for audit unless we want to prevent dups on re-run.
        // Audit table usually append-only. But for test data, let's avoid dups.
        // We assume audit_events has an ID or we rely on unique constraint?
        // Let's check schema/create_audit_table.ts via memory: table likely has serial/uuid PK.
        // To prevent duplicates, we need to check existence if no logical unique key exists.

        const auditKey = `run:${weekStart}`;
        const existingAudit = await query(`SELECT event_id FROM audit_events WHERE org_id = $1 AND metadata->>'week_start' = $2`, [orgId, weekStart]);

        if (existingAudit.rows.length === 0) {
            await query(
                `INSERT INTO audit_events (org_id, event_type, metadata, created_at)
                 VALUES ($1, 'WEEKLY_RUN_COMPLETED', $2, $3)`,
                [
                    orgId,
                    JSON.stringify({ week_start: weekStart, success: true }),
                    new Date(new Date(weekStart).getTime() + 4 * 3600000).toISOString() // Monday + 4h
                ]
            );
        }

        // 2. Random Team Events
        for (const team of teams) {
            // Use deterministic RNG for this decision
            if (rng() > 0.8) {
                const auditId = getStableUUID('audit', `${weekStart}:${team.name}:TEAM_SETTINGS_UPDATED`);
                await query(
                    `INSERT INTO audit_events (event_id, org_id, team_id, event_type, metadata, created_at)
                     VALUES ($1, $2, $3, 'TEAM_SETTINGS_UPDATED', $4, $5)
                     ON CONFLICT (event_id) DO NOTHING`,
                    [
                        auditId,
                        orgId,
                        team.team_id,
                        JSON.stringify({ setting: 'threshold', old: 0.5, new: 0.6 }),
                        new Date(new Date(weekStart).getTime() + 24 * 3600000).toISOString()
                    ]
                );
            }
        }
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

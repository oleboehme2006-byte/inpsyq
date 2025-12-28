/**
 * INTERPRETATION SERVICE — Cache + Generation Orchestration
 * 
 * Entry points for getting or creating interpretations.
 * Implements idempotency via input_hash checking.
 */

import { query } from '@/db/client';
import {
    WeeklyInterpretationSections,
    WeeklyInterpretationRecord,
    PROMPT_VERSION
} from '@/lib/interpretation/types';
import {
    WeeklyInterpretationInput,
    buildInterpretationInput
} from '@/lib/interpretation/input';
import { computeInterpretationHash } from '@/lib/interpretation/hash';
import { generateWeeklyInterpretation } from '@/lib/interpretation/generator';
import { validateAll } from '@/lib/interpretation/validate';
import { evaluatePolicy } from '@/lib/interpretation/policy';
import { INTERPRETATION_SCHEMA_SQL } from '@/lib/interpretation/schema';
import { getTeamDashboardData } from '@/services/dashboard/teamReader';

// ============================================================================
// Schema Enforcement
// ============================================================================

let schemaEnsured = false;
async function ensureSchema(): Promise<void> {
    if (schemaEnsured) return;
    try {
        await query(INTERPRETATION_SCHEMA_SQL);
        schemaEnsured = true;
    } catch (e) {
        schemaEnsured = true;
    }
}

// ============================================================================
// Service Entry Points
// ============================================================================

export interface InterpretationResult {
    record: WeeklyInterpretationRecord;
    cacheHit: boolean;
    generated: boolean;
}

/**
 * Get or create interpretation for a team.
 */
export async function getOrCreateTeamInterpretation(
    orgId: string,
    teamId: string,
    weekStart?: string
): Promise<InterpretationResult> {
    await ensureSchema();

    // Load weekly product via Phase 7 reader
    const dashboardData = await getTeamDashboardData(orgId, teamId, 9);
    if (!dashboardData) {
        throw new Error(`NO_WEEKLY_PRODUCT: No data for team ${teamId}`);
    }

    const targetWeek = weekStart || dashboardData.meta.latestWeek;

    // Build interpretation input
    const inputHash = dashboardData.meta.computeVersion + ':' + dashboardData.meta.latestWeek;
    const input = buildInterpretationInput(dashboardData, inputHash);
    input.weekStart = targetWeek;

    // Compute interpretation-specific hash
    const interpHash = computeInterpretationHash(input);

    // Check cache
    const cached = await getActiveInterpretation(orgId, teamId, targetWeek);
    if (cached && cached.inputHash === interpHash) {
        return { record: cached, cacheHit: true, generated: false };
    }

    // Generate new interpretation
    const result = await generateWeeklyInterpretation(input);

    // Validate
    const validated = validateAll(result.sections, input, result.policy);

    // Store (atomic: deactivate old, insert new)
    const record = await storeInterpretation({
        orgId,
        teamId,
        weekStart: targetWeek,
        inputHash: interpHash,
        modelId: result.modelId,
        promptVersion: result.promptVersion,
        sectionsJson: validated,
    });

    return { record, cacheHit: false, generated: true };
}

/**
 * Get or create interpretation for an org (org-level, teamId = null).
 */
export async function getOrCreateOrgInterpretation(
    orgId: string,
    weekStart?: string
): Promise<InterpretationResult> {
    await ensureSchema();

    // For org-level, we need to aggregate across teams
    // For now, use the first team's data as proxy
    const teamsResult = await query(
        `SELECT team_id FROM teams WHERE org_id = $1 LIMIT 1`,
        [orgId]
    );

    if (teamsResult.rows.length === 0) {
        throw new Error(`NO_WEEKLY_PRODUCT: No teams found for org ${orgId}`);
    }

    const firstTeamId = teamsResult.rows[0].team_id;
    const dashboardData = await getTeamDashboardData(orgId, firstTeamId, 9);

    if (!dashboardData) {
        throw new Error(`NO_WEEKLY_PRODUCT: No data for org ${orgId}`);
    }

    const targetWeek = weekStart || dashboardData.meta.latestWeek;

    // Build interpretation input (org-level)
    const inputHash = dashboardData.meta.computeVersion + ':' + targetWeek + ':org';
    const input = buildInterpretationInput(dashboardData, inputHash);
    input.teamId = null;
    input.weekStart = targetWeek;

    const interpHash = computeInterpretationHash(input);

    // Check cache
    const cached = await getActiveInterpretation(orgId, null, targetWeek);
    if (cached && cached.inputHash === interpHash) {
        return { record: cached, cacheHit: true, generated: false };
    }

    // Generate
    const result = await generateWeeklyInterpretation(input);
    const validated = validateAll(result.sections, input, result.policy);

    // Store
    const record = await storeInterpretation({
        orgId,
        teamId: null,
        weekStart: targetWeek,
        inputHash: interpHash,
        modelId: result.modelId,
        promptVersion: result.promptVersion,
        sectionsJson: validated,
    });

    return { record, cacheHit: false, generated: true };
}

// ============================================================================
// Storage Operations
// ============================================================================

async function getActiveInterpretation(
    orgId: string,
    teamId: string | null,
    weekStart: string
): Promise<WeeklyInterpretationRecord | null> {
    const result = teamId
        ? await query(
            `SELECT * FROM weekly_interpretations 
         WHERE org_id = $1 AND team_id = $2 AND week_start = $3 AND is_active = true`,
            [orgId, teamId, weekStart]
        )
        : await query(
            `SELECT * FROM weekly_interpretations 
         WHERE org_id = $1 AND team_id IS NULL AND week_start = $2 AND is_active = true`,
            [orgId, weekStart]
        );

    if (result.rows.length === 0) return null;
    return mapRecord(result.rows[0]);
}

interface StoreParams {
    orgId: string;
    teamId: string | null;
    weekStart: string;
    inputHash: string;
    modelId: string;
    promptVersion: string;
    sectionsJson: WeeklyInterpretationSections;
}

async function storeInterpretation(params: StoreParams): Promise<WeeklyInterpretationRecord> {
    // Deactivate existing active row (if any)
    if (params.teamId) {
        await query(
            `UPDATE weekly_interpretations 
       SET is_active = false 
       WHERE org_id = $1 AND team_id = $2 AND week_start = $3 AND is_active = true`,
            [params.orgId, params.teamId, params.weekStart]
        );
    } else {
        await query(
            `UPDATE weekly_interpretations 
       SET is_active = false 
       WHERE org_id = $1 AND team_id IS NULL AND week_start = $2 AND is_active = true`,
            [params.orgId, params.weekStart]
        );
    }

    // Insert new active row
    const result = await query(
        `INSERT INTO weekly_interpretations 
       (org_id, team_id, week_start, input_hash, model_id, prompt_version, sections_json, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     RETURNING *`,
        [
            params.orgId,
            params.teamId,
            params.weekStart,
            params.inputHash,
            params.modelId,
            params.promptVersion,
            JSON.stringify(params.sectionsJson),
        ]
    );

    return mapRecord(result.rows[0]);
}

function mapRecord(row: any): WeeklyInterpretationRecord {
    return {
        orgId: row.org_id,
        teamId: row.team_id,
        weekStart: new Date(row.week_start).toISOString().slice(0, 10),
        inputHash: row.input_hash,
        createdAt: new Date(row.created_at),
        modelId: row.model_id,
        promptVersion: row.prompt_version,
        sectionsJson: row.sections_json,
        sectionsMd: row.sections_md,
        isActive: row.is_active,
    };
}

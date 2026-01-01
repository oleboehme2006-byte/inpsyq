/**
 * INTERPRETATION SERVICE — Cache + Generation Orchestration
 * 
 * Entry points for getting or creating interpretations.
 * Implements idempotency via input_hash checking.
 * Orchestrates LLM generation with deterministic fallbacks.
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
import { generateDeterministicInterpretation } from '@/lib/interpretation/generator';
import { validateAll, validateNumericSpam, InterpretationValidationError } from '@/lib/interpretation/validate';
import { evaluatePolicy } from '@/lib/interpretation/policy';
import { INTERPRETATION_SCHEMA_SQL } from '@/lib/interpretation/schema';
import { getTeamDashboardData } from '@/services/dashboard/teamReader';
import { GroundingMap, assertGroundingMap } from '@/lib/interpretation/grounding';
import { getLLMConfig } from '@/services/llm/config';
import { OpenAIProvider } from '@/services/llm/openai';
import { DisabledProvider } from '@/services/llm/disabled';
import { LLMProvider } from '@/services/llm/types';
import { SECURITY_LIMITS } from '@/lib/security/limits';
import { logAuditEvent } from '@/services/audit/events';
import { logInterpretationUsage, checkTokenBudget } from '@/services/monitoring/usage';

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
// Concurrency Control
// ============================================================================

class ConcurrencyLimiter {
    private active = 0;
    private queue: Array<() => void> = [];

    constructor(private max: number) { }

    async acquire(): Promise<void> {
        if (this.active < this.max) {
            this.active++;
            return;
        }
        return new Promise<void>(resolve => {
            this.queue.push(resolve);
        });
    }

    release(): void {
        this.active--;
        if (this.queue.length > 0) {
            this.active++;
            const next = this.queue.shift();
            if (next) next();
        }
    }
}

const llmConfig = getLLMConfig();
const concurrencyLimiter = new ConcurrencyLimiter(llmConfig.concurrency);

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

    return getOrCreateInterpretationCommon(orgId, teamId, targetWeek, input);
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
    // For now, use the first team's data as proxy (Phase 9 logic)
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

    return getOrCreateInterpretationCommon(orgId, null, targetWeek, input);
}

// Common orchestration logic
async function getOrCreateInterpretationCommon(
    orgId: string,
    teamId: string | null,
    targetWeek: string,
    input: WeeklyInterpretationInput
): Promise<InterpretationResult> {
    const interpHash = computeInterpretationHash(input);

    // Check cache
    const cached = await getActiveInterpretation(orgId, teamId, targetWeek);
    const config = getLLMConfig();

    // STRICT PROVIDER MODE CHECK
    let cacheValid = false;
    if (cached && cached.inputHash === interpHash) {
        if (config.provider === 'disabled') {
            // Must be deterministic
            if (cached.modelId === 'interaction_deterministic_v1') {
                cacheValid = true;
            }
        } else {
            // Provider enabled. 
            // Prefer cached if hash matches, even if deterministic fallback from before.
            // But if we have LLM available, we might want to upgrade?
            // For stability/cost, sticking to valid cache is preferred.
            cacheValid = true;
        }
    }

    if (cacheValid && cached) {
        return { record: cached, cacheHit: true, generated: false };
    }

    // Generate new interpretation (LLM or Deterministic)

    // Security: Check Generation Limits (Cost Control)
    if (teamId) {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
        const limitRes = await query(`
            SELECT COUNT(*) as count 
            FROM audit_events 
            WHERE org_id = $1 
              AND team_id = $2
              AND event_type = 'INTERPRETATION_GENERATED'
              AND created_at > $3
        `, [orgId, teamId, startOfWeek]);

        const genCount = parseInt(limitRes.rows[0].count, 10);
        if (genCount >= SECURITY_LIMITS.MAX_GENERATIONS_PER_WEEK) {
            throw new Error(`Generation limit exceeded (${genCount}/${SECURITY_LIMITS.MAX_GENERATIONS_PER_WEEK} this week)`);
        }
    }

    // Security: Check Token Budget (Soft Limit)
    // If budget exceeded, force fallback
    let forceDeterministic = false;
    const isBudgetOk = await checkTokenBudget(orgId, 200000); // 200k tokens/week hardcoded limit
    if (!isBudgetOk) {
        forceDeterministic = true;
    }

    const context = { orgId, teamId, weekStart: targetWeek, inputHash: interpHash };
    const result = await generateOrchestrated(input, context, forceDeterministic);

    // Audit Log
    const eventType = result.deterministicFallback ? 'INTERPRETATION_FALLBACK' : 'INTERPRETATION_GENERATED';
    logAuditEvent(orgId, teamId, eventType, {
        modelId: result.modelId,
        promptVersion: result.promptVersion,
        inputHash: interpHash
    }).catch(console.error);

    // Store (atomic: deactivate old, insert new)
    const record = await storeInterpretation({
        orgId,
        teamId,
        weekStart: targetWeek,
        inputHash: interpHash,
        modelId: result.modelId,
        promptVersion: result.promptVersion,
        sectionsJson: result.sections,
        groundingMap: result.groundingMap
    });

    return { record, cacheHit: false, generated: true };
}

// ============================================================================
// Generation Orchestrator
// ============================================================================

interface OrchestratedResult {
    sections: WeeklyInterpretationSections;
    modelId: string;
    promptVersion: string;
    groundingMap?: GroundingMap;
    deterministicFallback: boolean;
}

interface GenerationContext {
    orgId: string;
    teamId: string | null;
    weekStart: string;
    inputHash: string;
}

async function generateOrchestrated(
    input: WeeklyInterpretationInput,
    context?: GenerationContext,
    forceDeterministic: boolean = false
): Promise<OrchestratedResult> {
    const config = getLLMConfig();
    const useLLM = !forceDeterministic && config.provider !== 'disabled' && !!config.apiKey;

    if (useLLM) {
        try {
            await concurrencyLimiter.acquire();
            const provider: LLMProvider = new OpenAIProvider();

            // Build system prompt
            const systemPrompt = `You are an expert organizational psychologist generating an interpretation of weekly team metrics.
Rules:
1. Output MUST be valid JSON matching the WeeklyInterpretationSections schema.
2. Output MUST include a "grounding_map" array.
3. Do NOT invent numbers. 
4. Do NOT hallucinate metric names.
5. Max numeric values mentioned: ${config.numericCap}.
6. Forbidden phrases: "burnout", "toxic", "crisis".
7. Focus on constructive analysis.`;

            // Create user prompt from input
            const userPrompt = JSON.stringify(input);

            const startTime = Date.now();
            const result = await provider.generateJSON<{
                interpretation: WeeklyInterpretationSections;
                grounding_map: GroundingMap;
            }>(
                systemPrompt,
                userPrompt
            );
            const latencyMs = Date.now() - startTime;

            if (result.ok) {
                const { interpretation, grounding_map } = result.json;

                // Validate everything
                const policy = evaluatePolicy(input);
                const validated = validateAll(interpretation, input, policy);
                assertGroundingMap(grounding_map, input);

                // Log Usage
                if (context) {
                    await logInterpretationUsage({
                        orgId: context.orgId,
                        teamId: context.teamId,
                        weekStart: context.weekStart,
                        inputHash: context.inputHash,
                        modelId: result.model,
                        promptTokens: result.usage?.inputTokens || 0,
                        completionTokens: result.usage?.outputTokens || 0,
                        latencyMs,
                        provider: result.provider || config.provider as string,
                        isFallback: false
                    });
                }

                return {
                    sections: validated,
                    modelId: result.model,
                    promptVersion: PROMPT_VERSION,
                    groundingMap: grounding_map,
                    deterministicFallback: false
                };
            } else {
                console.warn('LLM Generation failed:', result.error);
                throw new Error(`LLM Error: ${result.error.code}`);
            }
        } catch (e: any) {
            console.error('LLM Failed, falling back to deterministic:', e.message);
            // Fallthrough to deterministic
        } finally {
            concurrencyLimiter.release();
        }
    }

    // Deterministic Fallback
    const startTimeDet = Date.now();
    const result = await generateDeterministicInterpretation(input);
    const latencyMsDet = Date.now() - startTimeDet;

    if (context) {
        await logInterpretationUsage({
            orgId: context.orgId,
            teamId: context.teamId,
            weekStart: context.weekStart,
            inputHash: context.inputHash,
            modelId: result.modelId,
            promptTokens: 0,
            completionTokens: 0,
            latencyMs: latencyMsDet,
            provider: 'deterministic',
            isFallback: true
        });
    }

    return {
        sections: result.sections,
        modelId: result.modelId,
        promptVersion: result.promptVersion,
        deterministicFallback: true
    };
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
    groundingMap?: GroundingMap;
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

    const result = await query(
        `INSERT INTO weekly_interpretations 
       (org_id, team_id, week_start, input_hash, model_id, prompt_version, sections_json, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     ON CONFLICT (org_id, COALESCE(team_id, '00000000-0000-0000-0000-000000000000'::uuid), week_start, input_hash)
     DO UPDATE SET is_active = true, created_at = NOW()
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

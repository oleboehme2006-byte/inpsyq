/**
 * WEEKLY RUNNER TYPES
 * 
 * Types for weekly automation orchestration.
 */

// ============================================================================
// Run Status
// ============================================================================

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'partial';

export type TeamRunStatus = 'success' | 'skipped' | 'failed';

// ============================================================================
// Team Result
// ============================================================================

export interface TeamRunResult {
    teamId: string;
    teamName?: string;

    // Pipeline result
    pipeline: {
        status: TeamRunStatus;
        upserted: boolean;
        skipped: boolean;
        durationMs?: number;
        error?: string;
    };

    // Interpretation result
    interpretation: {
        status: TeamRunStatus;
        generated: boolean;
        cacheHit: boolean;
        durationMs?: number;
        error?: string;
    };

    durationMs: number;
}

// ============================================================================
// Org Run Result
// ============================================================================

export interface OrgRunResult {
    orgId: string;
    orgName?: string;
    weekStart: string;
    weekLabel: string;

    status: RunStatus;
    teams: TeamRunResult[];

    counts: {
        total: number;
        pipelineSuccess: number;
        pipelineSkipped: number;
        pipelineFailed: number;
        interpretationSuccess: number;
        interpretationSkipped: number;
        interpretationFailed: number;
    };

    startedAt: Date;
    finishedAt: Date;
    durationMs: number;

    error?: string;
}

// ============================================================================
// Run Mode
// ============================================================================

export type RunMode = 'FULL' | 'PIPELINE_ONLY' | 'INTERPRETATION_ONLY';

// ============================================================================
// Weekly Run Options
// ============================================================================

export interface WeeklyRunOptions {
    dryRun?: boolean;
    mode?: RunMode;
    concurrency?: number;        // team-level concurrency within an org
    orgConcurrency?: number;     // org-level concurrency (default DEFAULT_ORG_CONCURRENCY)
    teamTimeoutMs?: number;
    totalTimeoutMs?: number;     // @deprecated — kept for API compat; ignored in new runner
}

// ============================================================================
// Audit Record
// ============================================================================

export interface WeeklyRunAudit {
    runId: string;
    weekStart: string;
    weekLabel: string;
    scope: 'all' | 'org';
    scopeId?: string;

    status: RunStatus;

    counts: {
        orgsTotal: number;
        orgsSuccess: number;
        orgsFailed: number;
        teamsTotal: number;
        teamsSuccess: number;
        teamsFailed: number;
        pipelineUpserts: number;
        pipelineSkips: number;
        interpretationGenerations: number;
        interpretationCacheHits: number;
    };

    startedAt: Date;
    finishedAt?: Date;
    durationMs?: number;

    error?: string;
    details?: Record<string, OrgRunResult>;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_CONCURRENCY = 3;
export const DEFAULT_ORG_CONCURRENCY = 3;          // concurrent orgs (Module 4)

// Timeout hierarchy (each must comfortably exceed the one it wraps):
//   LLM call:        15 s   (reduced from 20s)
//   Interpretation:  20 s   (LLM + DB overhead)
//   Pipeline phase:  10 s   (DB rollup only)
//   Team total:      35 s   (pipeline + interpretation, sequential)
//   Per-org:         adaptive — teamCount × 45 s, capped at 1 200 s (20 min)
//   Global:          removed — replaced by per-org parallelism

export const DEFAULT_TEAM_TIMEOUT_MS   = 35_000;   // was 5 000 — fatal for LLM
export const DEFAULT_PIPELINE_TIMEOUT_MS = 10_000;
export const DEFAULT_INTERP_TIMEOUT_MS   = 20_000;
export const DEFAULT_ORG_TIMEOUT_PER_TEAM_MS = 45_000; // × teamCount
export const DEFAULT_ORG_TIMEOUT_MAX_MS = 1_200_000;  // 20 min hard cap

/** @deprecated Use per-org adaptive timeout instead (Module 4). Kept for API compat. */
export const DEFAULT_TOTAL_TIMEOUT_MS = 300_000;

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
        error?: string;
    };

    // Interpretation result
    interpretation: {
        status: TeamRunStatus;
        generated: boolean;
        cacheHit: boolean;
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
    concurrency?: number;
    teamTimeoutMs?: number;
    totalTimeoutMs?: number;
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
export const DEFAULT_TEAM_TIMEOUT_MS = 5000;
export const DEFAULT_TOTAL_TIMEOUT_MS = 300000; // 5 minutes

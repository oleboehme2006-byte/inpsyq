/**
 * WEEKLY RUN AUDIT SERVICE
 * 
 * Persistent audit logging for weekly automation runs.
 */

import { query } from '@/db/client';
import { WEEKLY_RUNS_SCHEMA_SQL } from './schema';
import { WeeklyRunAudit, RunStatus, OrgRunResult } from './types';

// ============================================================================
// Schema Enforcement
// ============================================================================

let schemaEnsured = false;

export async function ensureAuditSchema(): Promise<void> {
    if (schemaEnsured) return;
    try {
        await query(WEEKLY_RUNS_SCHEMA_SQL);
        schemaEnsured = true;
    } catch (e) {
        // Schema may already exist
        schemaEnsured = true;
    }
}

// ============================================================================
// Audit Operations
// ============================================================================

export async function startRun(params: {
    weekStart: string;
    weekLabel: string;
    scope: 'all' | 'org';
    scopeId?: string;
}): Promise<string> {
    await ensureAuditSchema();

    const result = await query(
        `INSERT INTO weekly_runs (week_start, week_label, scope, scope_id, status)
         VALUES ($1, $2, $3, $4, 'running')
         RETURNING run_id`,
        [params.weekStart, params.weekLabel, params.scope, params.scopeId || null]
    );

    return result.rows[0].run_id;
}

export async function finishRun(params: {
    runId: string;
    status: RunStatus;
    counts: WeeklyRunAudit['counts'];
    durationMs: number;
    error?: string;
    details?: Record<string, OrgRunResult>;
}): Promise<void> {
    await query(
        `UPDATE weekly_runs SET
            status = $2,
            orgs_total = $3,
            orgs_success = $4,
            orgs_failed = $5,
            teams_total = $6,
            teams_success = $7,
            teams_failed = $8,
            pipeline_upserts = $9,
            pipeline_skips = $10,
            interpretation_generations = $11,
            interpretation_cache_hits = $12,
            finished_at = NOW(),
            duration_ms = $13,
            error = $14,
            details_json = $15
         WHERE run_id = $1`,
        [
            params.runId,
            params.status,
            params.counts.orgsTotal,
            params.counts.orgsSuccess,
            params.counts.orgsFailed,
            params.counts.teamsTotal,
            params.counts.teamsSuccess,
            params.counts.teamsFailed,
            params.counts.pipelineUpserts,
            params.counts.pipelineSkips,
            params.counts.interpretationGenerations,
            params.counts.interpretationCacheHits,
            params.durationMs,
            params.error || null,
            params.details ? JSON.stringify(params.details) : null,
        ]
    );
}

export async function getRunsByWeek(weekStart: string): Promise<WeeklyRunAudit[]> {
    await ensureAuditSchema();

    const result = await query(
        `SELECT * FROM weekly_runs WHERE week_start = $1 ORDER BY started_at DESC`,
        [weekStart]
    );

    return result.rows.map(mapRecord);
}

export async function getRunById(runId: string): Promise<WeeklyRunAudit | null> {
    await ensureAuditSchema();

    const result = await query(
        `SELECT * FROM weekly_runs WHERE run_id = $1`,
        [runId]
    );

    if (result.rows.length === 0) return null;
    return mapRecord(result.rows[0]);
}

export async function getLatestRuns(limit: number = 10): Promise<WeeklyRunAudit[]> {
    await ensureAuditSchema();

    const result = await query(
        `SELECT * FROM weekly_runs ORDER BY started_at DESC LIMIT $1`,
        [limit]
    );

    return result.rows.map(mapRecord);
}

function mapRecord(row: any): WeeklyRunAudit {
    return {
        runId: row.run_id,
        weekStart: new Date(row.week_start).toISOString().slice(0, 10),
        weekLabel: row.week_label,
        scope: row.scope,
        scopeId: row.scope_id,
        status: row.status as RunStatus,
        counts: {
            orgsTotal: row.orgs_total || 0,
            orgsSuccess: row.orgs_success || 0,
            orgsFailed: row.orgs_failed || 0,
            teamsTotal: row.teams_total || 0,
            teamsSuccess: row.teams_success || 0,
            teamsFailed: row.teams_failed || 0,
            pipelineUpserts: row.pipeline_upserts || 0,
            pipelineSkips: row.pipeline_skips || 0,
            interpretationGenerations: row.interpretation_generations || 0,
            interpretationCacheHits: row.interpretation_cache_hits || 0,
        },
        startedAt: new Date(row.started_at),
        finishedAt: row.finished_at ? new Date(row.finished_at) : undefined,
        durationMs: row.duration_ms,
        error: row.error,
        details: row.details_json,
    };
}

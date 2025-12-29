/**
 * WEEKLY RUNNER — Main Orchestrator
 * 
 * Autonomous weekly cycle for Phase 6 pipeline + Phase 9 interpretation.
 * Idempotent, bounded concurrency, auditable, with distributed locking.
 */

import { query } from '@/db/client';
import { getCanonicalWeek, getPreviousWeeks } from '@/lib/week';
import { runWeeklyRollup } from '@/services/pipeline/runner';
import { getOrCreateTeamInterpretation } from '@/services/interpretation/service';
import { startRun, finishRun } from './audit';
import { buildLockKey, acquireLock, releaseLock } from './lock';
import { sendRunFailureAlert, shouldAlert } from '@/services/alerts/webhook';
import {
    TeamRunResult,
    OrgRunResult,
    WeeklyRunOptions,
    RunStatus,
    RunMode,
    DEFAULT_CONCURRENCY,
    DEFAULT_TEAM_TIMEOUT_MS,
    DEFAULT_TOTAL_TIMEOUT_MS,
} from './types';

// ============================================================================
// Main Entry Point
// ============================================================================

export interface WeeklyRunResult {
    runId: string;
    weekStart: string;
    weekLabel: string;
    status: RunStatus;
    orgs: OrgRunResult[];
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
    durationMs: number;
    error?: string;
}

/**
 * Run weekly automation for all orgs or a specific org/team.
 */
export async function runWeekly(params: {
    orgId?: string;
    teamId?: string;
    weekStart?: string;
    weekOffset?: number;
    options?: WeeklyRunOptions;
}): Promise<WeeklyRunResult> {
    const startTime = Date.now();
    const mode: RunMode = params.options?.mode ?? 'FULL';
    const options = {
        dryRun: params.options?.dryRun ?? false,
        mode,
        concurrency: params.options?.concurrency ?? DEFAULT_CONCURRENCY,
        teamTimeoutMs: params.options?.teamTimeoutMs ?? DEFAULT_TEAM_TIMEOUT_MS,
        totalTimeoutMs: params.options?.totalTimeoutMs ?? DEFAULT_TOTAL_TIMEOUT_MS,
    };

    // Resolve week from offset or explicit value
    let resolvedWeekStart = params.weekStart;
    if (params.weekOffset !== undefined && !resolvedWeekStart) {
        const weeks = getPreviousWeeks(Math.abs(params.weekOffset) + 1);
        resolvedWeekStart = weeks[Math.abs(params.weekOffset)]?.weekStartStr;
    }

    // Resolve canonical week
    const { weekStart, weekStartStr, weekLabel } = getCanonicalWeek(new Date(), resolvedWeekStart);

    // Build lock key
    const lockKey = buildLockKey({
        weekStart: weekStartStr,
        orgId: params.orgId,
        teamId: params.teamId,
        mode,
    });

    // Try to acquire lock (skip for dry run)
    let runId: string;
    if (!options.dryRun) {
        // Start audit record first to get runId
        runId = await startRun({
            weekStart: weekStartStr,
            weekLabel,
            scope: params.orgId ? 'org' : 'all',
            scopeId: params.orgId,
        });

        const lockResult = await acquireLock({ lockKey, runId });
        if (!lockResult.acquired) {
            // Already locked
            await finishRun({
                runId,
                status: 'failed',
                counts: { orgsTotal: 0, orgsSuccess: 0, orgsFailed: 0, teamsTotal: 0, teamsSuccess: 0, teamsFailed: 0, pipelineUpserts: 0, pipelineSkips: 0, interpretationGenerations: 0, interpretationCacheHits: 0 },
                durationMs: Date.now() - startTime,
                error: `LOCKED: Another run in progress (${lockResult.existingRunId})`,
            });
            return {
                runId,
                weekStart: weekStartStr,
                weekLabel,
                status: 'failed',
                orgs: [],
                counts: { orgsTotal: 0, orgsSuccess: 0, orgsFailed: 0, teamsTotal: 0, teamsSuccess: 0, teamsFailed: 0, pipelineUpserts: 0, pipelineSkips: 0, interpretationGenerations: 0, interpretationCacheHits: 0 },
                durationMs: Date.now() - startTime,
                error: `LOCKED: Another run in progress`,
            };
        }
    } else {
        // Dry run - generate a temporary ID
        runId = `dry-run-${Date.now()}`;
    }

    const orgs: OrgRunResult[] = [];
    const counts = {
        orgsTotal: 0,
        orgsSuccess: 0,
        orgsFailed: 0,
        teamsTotal: 0,
        teamsSuccess: 0,
        teamsFailed: 0,
        pipelineUpserts: 0,
        pipelineSkips: 0,
        interpretationGenerations: 0,
        interpretationCacheHits: 0,
    };

    let status: RunStatus = 'completed';
    let error: string | undefined;

    try {
        // Get orgs to process
        const orgIds = params.orgId
            ? [params.orgId]
            : await getAllOrgIds();

        counts.orgsTotal = orgIds.length;

        // Total timeout guard
        const deadline = Date.now() + options.totalTimeoutMs;

        // Process orgs sequentially to avoid overwhelming DB
        for (const orgId of orgIds) {
            if (Date.now() > deadline) {
                status = 'partial';
                error = 'Total timeout exceeded';
                break;
            }

            try {
                const orgResult = await runWeeklyForOrg(
                    orgId,
                    weekStart,
                    weekStartStr,
                    weekLabel,
                    options
                );

                orgs.push(orgResult);

                // Aggregate counts
                counts.teamsTotal += orgResult.counts.total;
                counts.teamsSuccess += orgResult.counts.total - orgResult.counts.pipelineFailed;
                counts.teamsFailed += orgResult.counts.pipelineFailed;
                counts.pipelineUpserts += orgResult.counts.pipelineSuccess - orgResult.counts.pipelineSkipped;
                counts.pipelineSkips += orgResult.counts.pipelineSkipped;
                counts.interpretationGenerations += orgResult.counts.interpretationSuccess - orgResult.counts.interpretationSkipped;
                counts.interpretationCacheHits += orgResult.counts.interpretationSkipped;

                if (orgResult.status === 'completed') {
                    counts.orgsSuccess++;
                } else {
                    counts.orgsFailed++;
                    if (orgResult.status === 'failed') {
                        status = 'partial';
                    }
                }
            } catch (e: any) {
                counts.orgsFailed++;
                status = 'partial';
                orgs.push({
                    orgId,
                    weekStart: weekStartStr,
                    weekLabel,
                    status: 'failed',
                    teams: [],
                    counts: { total: 0, pipelineSuccess: 0, pipelineSkipped: 0, pipelineFailed: 0, interpretationSuccess: 0, interpretationSkipped: 0, interpretationFailed: 0 },
                    startedAt: new Date(),
                    finishedAt: new Date(),
                    durationMs: 0,
                    error: e.message,
                });
            }
        }
    } catch (e: any) {
        status = 'failed';
        error = e.message;
    }

    const durationMs = Date.now() - startTime;

    // Finish audit record (skip for dry run)
    if (!options.dryRun) {
        await finishRun({
            runId,
            status,
            counts,
            durationMs,
            error,
            details: orgs.reduce((acc, org) => ({ ...acc, [org.orgId]: org }), {}),
        });

        // Release lock
        await releaseLock({
            lockKey,
            runId,
            status: status === 'completed' ? 'COMPLETED' : 'FAILED',
        });

        // Send alert if needed
        if (shouldAlert(status, counts.teamsFailed)) {
            await sendRunFailureAlert({
                runId,
                weekStart: weekStartStr,
                status,
                counts: {
                    orgs_total: counts.orgsTotal,
                    orgs_success: counts.orgsSuccess,
                    orgs_failed: counts.orgsFailed,
                    teams_total: counts.teamsTotal,
                    teams_success: counts.teamsSuccess,
                    teams_failed: counts.teamsFailed,
                },
                topError: error || orgs.find(o => o.error)?.error,
            });
        }
    }

    return {
        runId,
        weekStart: weekStartStr,
        weekLabel,
        status,
        orgs,
        counts,
        durationMs,
        error,
    };
}

// ============================================================================
// Org-Level Processing
// ============================================================================

async function runWeeklyForOrg(
    orgId: string,
    weekStart: Date,
    weekStartStr: string,
    weekLabel: string,
    options: { concurrency: number; teamTimeoutMs: number; dryRun: boolean }
): Promise<OrgRunResult> {
    const startTime = Date.now();

    // Get teams for org
    const teams = await getTeamsForOrg(orgId);

    const results: TeamRunResult[] = [];
    const counts = {
        total: teams.length,
        pipelineSuccess: 0,
        pipelineSkipped: 0,
        pipelineFailed: 0,
        interpretationSuccess: 0,
        interpretationSkipped: 0,
        interpretationFailed: 0,
    };

    // Process teams with bounded concurrency
    for (let i = 0; i < teams.length; i += options.concurrency) {
        const batch = teams.slice(i, i + options.concurrency);

        const batchResults = await Promise.allSettled(
            batch.map(team =>
                runWeeklyForTeam(orgId, team.teamId, team.teamName, weekStart, options)
            )
        );

        for (const result of batchResults) {
            if (result.status === 'fulfilled') {
                results.push(result.value);

                // Count pipeline results
                if (result.value.pipeline.status === 'success') {
                    counts.pipelineSuccess++;
                    if (result.value.pipeline.skipped) counts.pipelineSkipped++;
                } else if (result.value.pipeline.status === 'failed') {
                    counts.pipelineFailed++;
                }

                // Count interpretation results
                if (result.value.interpretation.status === 'success') {
                    counts.interpretationSuccess++;
                    if (result.value.interpretation.cacheHit) counts.interpretationSkipped++;
                } else if (result.value.interpretation.status === 'failed') {
                    counts.interpretationFailed++;
                }
            } else {
                // Rejected promise
                results.push({
                    teamId: 'unknown',
                    pipeline: { status: 'failed', upserted: false, skipped: false, error: result.reason?.message },
                    interpretation: { status: 'skipped', generated: false, cacheHit: false },
                    durationMs: 0,
                });
                counts.pipelineFailed++;
                counts.interpretationFailed++;
            }
        }
    }

    const durationMs = Date.now() - startTime;
    const status: RunStatus = counts.pipelineFailed > 0 ? 'partial' : 'completed';

    return {
        orgId,
        weekStart: weekStartStr,
        weekLabel,
        status,
        teams: results,
        counts,
        startedAt: new Date(startTime),
        finishedAt: new Date(),
        durationMs,
    };
}

// ============================================================================
// Team-Level Processing
// ============================================================================

async function runWeeklyForTeam(
    orgId: string,
    teamId: string,
    teamName: string | undefined,
    weekStart: Date,
    options: { teamTimeoutMs: number; dryRun: boolean }
): Promise<TeamRunResult> {
    const startTime = Date.now();

    const result: TeamRunResult = {
        teamId,
        teamName,
        pipeline: { status: 'skipped', upserted: false, skipped: true },
        interpretation: { status: 'skipped', generated: false, cacheHit: false },
        durationMs: 0,
    };

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Team timeout')), options.teamTimeoutMs);
    });

    try {
        // Run pipeline with timeout
        const pipelinePromise = (async () => {
            if (options.dryRun) {
                return { upserted: false, skipped: true };
            }

            const pipelineResult = await runWeeklyRollup(orgId, teamId, weekStart);
            return {
                upserted: pipelineResult.upserted,
                skipped: pipelineResult.skipped,
            };
        })();

        const pipelineResult = await Promise.race([pipelinePromise, timeoutPromise]);

        result.pipeline = {
            status: 'success',
            upserted: pipelineResult.upserted,
            skipped: pipelineResult.skipped,
        };
    } catch (e: any) {
        result.pipeline = {
            status: 'failed',
            upserted: false,
            skipped: false,
            error: e.message,
        };
    }

    // Only run interpretation if pipeline succeeded
    if (result.pipeline.status === 'success' && !options.dryRun) {
        try {
            const interpPromise = (async () => {
                const interpResult = await getOrCreateTeamInterpretation(
                    orgId,
                    teamId,
                    weekStart.toISOString().slice(0, 10)
                );
                return {
                    generated: interpResult.generated,
                    cacheHit: interpResult.cacheHit,
                };
            })();

            const interpResult = await Promise.race([interpPromise, timeoutPromise]);

            result.interpretation = {
                status: 'success',
                generated: interpResult.generated,
                cacheHit: interpResult.cacheHit,
            };
        } catch (e: any) {
            // Interpretation failure is not fatal
            result.interpretation = {
                status: 'failed',
                generated: false,
                cacheHit: false,
                error: e.message,
            };
        }
    }

    result.durationMs = Date.now() - startTime;
    return result;
}

// ============================================================================
// Helpers
// ============================================================================

async function getAllOrgIds(): Promise<string[]> {
    const result = await query(`SELECT org_id FROM orgs ORDER BY org_id`);
    return result.rows.map(r => r.org_id);
}

async function getTeamsForOrg(orgId: string): Promise<Array<{ teamId: string; teamName?: string }>> {
    const result = await query(
        `SELECT team_id, name FROM teams WHERE org_id = $1 ORDER BY team_id`,
        [orgId]
    );
    return result.rows.map(r => ({ teamId: r.team_id, teamName: r.name }));
}

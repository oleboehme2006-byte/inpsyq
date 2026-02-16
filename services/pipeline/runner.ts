/**
 * PIPELINE RUNNER — Main Orchestrator
 * 
 * Idempotent weekly product generation using Phase 3+4 logic.
 */

import { query } from '@/db/client';
import { weekStartISO as toWeekStartISO, listWeeksBackChronological, getISOMondayUTC } from '@/lib/aggregation/week';
import { buildTeamIndexSeries } from '@/lib/aggregation/buildSeries';
import { computeAttribution } from '@/lib/attribution/attributionEngine';
import { AggregationInputs, WeeklyIndexAggregate } from '@/lib/aggregation/types';
import { AttributionInputs } from '@/lib/attribution/input';
import { IndexId } from '@/lib/semantics/indexRegistry';

import { COMPUTE_VERSION, PIPELINE_MIGRATION_SQL } from './schema';
import { RunWeeklyRollupResult, BackfillResult, RebuildOrgResult, SeriesSnapshot, SeriesPointSnapshot } from './types';
import { computeInputHash, buildCanonicalInput } from './inputHash';
import { gatherTeamMeasurements, discoverWeeksWithData, getTeamsForOrg, getExistingRowHash } from './dataGatherer';

// ============================================================================
// Initialization
// ============================================================================

let migrationRun = false;

/**
 * Ensure pipeline schema migration is applied.
 */
async function ensureMigration(): Promise<void> {
    if (migrationRun) return;

    try {
        await query(PIPELINE_MIGRATION_SQL);
        migrationRun = true;
    } catch (err: any) {
        console.warn('[Pipeline] Migration warning:', err.message);
        migrationRun = true; // Proceed anyway
    }
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Run weekly rollup for a specific team and week.
 * Idempotent: skips if input_hash matches existing.
 */
export async function runWeeklyRollup(
    orgId: string,
    teamId: string,
    weekStart: Date
): Promise<RunWeeklyRollupResult> {
    await ensureMigration();

    const weekStartStr = toWeekStartISO(getISOMondayUTC(weekStart));

    // 1. Gather measurement data
    const gathered = await gatherTeamMeasurements(orgId, teamId, weekStart);

    if (gathered.userMeasurements.length === 0) {
        return { upserted: false, inputHash: '', skipped: true, reason: 'no_data' };
    }

    // 2. Compute input hash
    const canonicalInput = buildCanonicalInput(
        orgId,
        teamId,
        weekStartStr,
        gathered.userMeasurements
    );
    const inputHash = computeInputHash(canonicalInput);

    // 3. Check if row exists with same hash
    const existingHash = await getExistingRowHash(orgId, teamId, weekStart);
    if (existingHash === inputHash) {
        // Idempotent skip
        return { upserted: false, inputHash, skipped: true, reason: 'hash_match' };
    }

    // 4. Build aggregation inputs
    const aggregationInputs = buildAggregationInputs(gathered, orgId, teamId, weekStartStr);

    // 5. Build team index series using Phase 3 logic
    const seriesResult = buildTeamIndexSeries(aggregationInputs, 12, weekStartStr);

    // 6. Compute attribution for each index using Phase 4 logic
    const attributionResults = computeAttributionForAllIndices(seriesResult, gathered);

    // 7. Build series snapshot for storage
    const seriesSnapshot = buildSeriesSnapshot(seriesResult);

    // 8. Extract latest index values
    const latestIndices = extractLatestIndices(seriesResult);

    // 9. UPSERT to database
    await upsertWeeklyProduct({
        orgId,
        teamId,
        weekStartStr,
        inputHash,
        teamState: seriesResult.teamState,
        quality: seriesResult.quality,
        indices: latestIndices,
        series: seriesSnapshot,
        attribution: attributionResults,
    });

    // 10. Snapshot Employee Profiles (Phase 8)
    await snapshotEmployees(orgId, teamId, weekStart, gathered);

    return { upserted: true, inputHash, skipped: false };
}

/**
 * Snapshot employee profiles for the week.
 */
async function snapshotEmployees(
    orgId: string,
    teamId: string,
    weekStart: Date,
    gathered: Awaited<ReturnType<typeof gatherTeamMeasurements>>
): Promise<void> {
    const weekStartStr = toWeekStartISO(getISOMondayUTC(weekStart));

    for (const user of gathered.userMeasurements) {
        // Heuristic Profile Scoring (Placeholder logic for now, utilizing real latent states)
        // WRP: Withdrawal Risk Profile (High Withdrawal, Low Engagement)
        // OUC: Over-Utilization (High Strain, High Engagement)
        // TFP: Team Friction (High Trust Gap)

        const m = user.parameterMeans;
        const wrp = ((m['emotional_load'] || 0) + (1 - (m['meaning'] || 0))) / 2;
        const ouc = ((m['cognitive_load'] || 0) + (m['meaning'] || 0)) / 2;
        const tfp = 1 - ((m['trust_leadership'] || 0) + (m['psychological_safety'] || 0)) / 2;

        const profileScores = {
            WRP: Math.max(0, Math.min(1, wrp)),
            OUC: Math.max(0, Math.min(1, ouc)),
            TFP: Math.max(0, Math.min(1, tfp)),
        };

        await query(
            `INSERT INTO employee_profiles
             (user_id, org_id, team_id, week_start, parameter_means, parameter_uncertainty, profile_type_scores, confidence, updated_at)
             VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, NOW())
             ON CONFLICT (user_id, week_start)
             DO UPDATE SET
               parameter_means = $5,
               parameter_uncertainty = $6,
               profile_type_scores = $7,
               confidence = $8,
               updated_at = NOW()`,
            [
                user.userId,
                orgId,
                teamId,
                weekStartStr,
                JSON.stringify(user.parameterMeans),
                JSON.stringify(user.parameterVariance),
                JSON.stringify(profileScores),
                0.8 // Confidence placeholder
            ]
        );
    }
}

/**
 * Backfill a team for multiple weeks.
 */
export async function backfillTeam(
    orgId: string,
    teamId: string,
    weeksBack: number
): Promise<BackfillResult> {
    await ensureMigration();

    // Discover weeks with data
    const weeksWithData = await discoverWeeksWithData(orgId, teamId);

    let weeksToProcess: Date[];
    if (weeksWithData.length > 0) {
        // Use discovered weeks (limited to weeksBack)
        weeksToProcess = weeksWithData.slice(-weeksBack);
    } else {
        // Fallback: generate last N weeks
        const now = new Date();
        const currentWeekStr = toWeekStartISO(getISOMondayUTC(now));
        const weekStrings = listWeeksBackChronological(currentWeekStr, weeksBack);
        weeksToProcess = weekStrings.map(s => new Date(s));
    }

    let upserted = 0;
    let skipped = 0;

    for (const weekStart of weeksToProcess) {
        const result = await runWeeklyRollup(orgId, teamId, weekStart);
        if (result.upserted) upserted++;
        else skipped++;
    }

    return {
        weeksProcessed: weeksToProcess.length,
        upserted,
        skipped,
    };
}

/**
 * Rebuild all teams for an org.
 */
export async function rebuildAllForOrg(
    orgId: string,
    weeksBack: number
): Promise<RebuildOrgResult> {
    await ensureMigration();

    const teamIds = await getTeamsForOrg(orgId);

    let totalWeeks = 0;
    let totalUpserted = 0;

    for (const teamId of teamIds) {
        const result = await backfillTeam(orgId, teamId, weeksBack);
        totalWeeks += result.weeksProcessed;
        totalUpserted += result.upserted;
    }

    return {
        teamsProcessed: teamIds.length,
        totalWeeks,
        totalUpserted,
    };
}

// ============================================================================
// Helpers
// ============================================================================

function buildAggregationInputs(
    gathered: Awaited<ReturnType<typeof gatherTeamMeasurements>>,
    orgId: string,
    teamId: string,
    weekStartStr: string
): AggregationInputs {
    // Aggregate user measurements into weekly index aggregates
    const indexAggregates: Record<string, WeeklyIndexAggregate> = {};

    // Compute mean across all users for each parameter
    const paramSums: Record<string, { sum: number; count: number; varSum: number }> = {};

    for (const user of gathered.userMeasurements) {
        for (const [param, value] of Object.entries(user.parameterMeans)) {
            if (!paramSums[param]) {
                paramSums[param] = { sum: 0, count: 0, varSum: 0 };
            }
            paramSums[param].sum += value;
            paramSums[param].count++;
            paramSums[param].varSum += user.parameterVariance[param] || 0;
        }
    }

    // Map parameters to indices
    const indexMapping: Record<string, string[]> = {
        strain: ['emotional_load', 'cognitive_dissonance', 'role_conflict'],
        withdrawal_risk: ['emotional_load', 'meaning', 'autonomy_friction'],
        trust_gap: ['trust_leadership', 'trust_peers', 'psychological_safety'],
        engagement: ['meaning', 'autonomy', 'control'],
    };

    for (const [indexKey, params] of Object.entries(indexMapping)) {
        let indexSum = 0;
        let indexCount = 0;
        let sigmaSum = 0;

        for (const param of params) {
            if (paramSums[param]) {
                const mean = paramSums[param].sum / paramSums[param].count;
                const variance = paramSums[param].varSum / paramSums[param].count;
                indexSum += mean;
                indexCount++;
                sigmaSum += Math.sqrt(variance);
            }
        }

        if (indexCount > 0) {
            indexAggregates[indexKey] = {
                mean: indexSum / indexCount,
                sigma: sigmaSum / indexCount,
                sampleN: gathered.userCount,
                confidence: Math.min(1, gathered.userCount / 10),
            };
        }
    }

    return {
        teamId,
        orgId,
        perWeekIndexAggregates: {
            [weekStartStr]: indexAggregates,
        },
    };
}

function computeAttributionForAllIndices(
    seriesResult: ReturnType<typeof buildTeamIndexSeries>,
    gathered: Awaited<ReturnType<typeof gatherTeamMeasurements>>
): any[] {
    const indices: IndexId[] = ['strain', 'withdrawal_risk', 'trust_gap', 'engagement'];
    const results: any[] = [];

    for (const indexKey of indices) {
        const series = seriesResult.series.find(s => s.indexKey === indexKey);
        if (!series || series.points.length === 0) continue;

        const latestPoint = series.points[series.points.length - 1];

        // Build minimal attribution inputs
        const inputs: AttributionInputs = {
            indexKey,
            indexValue: latestPoint.value,
            indexSigma: latestPoint.sigma,
            indexDelta: latestPoint.delta,
            indexConfidence: latestPoint.confidence,
            volatility: latestPoint.volatility,
            candidateInternalDrivers: buildDriverCandidates(indexKey, gathered),
            candidateDependencies: [], // No external dependency data available
        };

        try {
            const attribution = computeAttribution(inputs);
            results.push(attribution);
        } catch {
            // Skip if attribution fails (e.g., forbidden driver combo)
        }
    }

    return results;
}

function buildDriverCandidates(
    indexKey: IndexId,
    gathered: Awaited<ReturnType<typeof gatherTeamMeasurements>>
): any[] {
    // Map indices to allowed driver families
    const indexToDrivers: Record<IndexId, string[]> = {
        strain: ['cognitive_load', 'emotional_load', 'role_conflict'],
        withdrawal_risk: ['emotional_load', 'autonomy_friction'],
        trust_gap: ['social_safety', 'alignment_clarity'],
        engagement: ['autonomy_friction', 'alignment_clarity', 'social_safety'],
    };

    const allowedDrivers = indexToDrivers[indexKey] || [];
    const candidates: any[] = [];

    // REAL DRIVER CALCULATION
    // Aggregate parameter means for allowed drivers (assuming driverFamily == parameter name)
    // In many cases, the parameter name IS the driver family. 
    // If not, we'd need a mapping. For now, we assume 1:1 or close enough for parameters produced by 'latent_states'.

    const paramSums: Record<string, { sum: number; count: number }> = {};
    for (const user of gathered.userMeasurements) {
        for (const [param, value] of Object.entries(user.parameterMeans)) {
            if (!paramSums[param]) paramSums[param] = { sum: 0, count: 0 };
            paramSums[param].sum += value;
            paramSums[param].count++;
        }
    }

    for (const driver of allowedDrivers) {
        // Driver parameter might be named similarly
        // We check direct match, or 'driver' in paramSums
        const stats = paramSums[driver];

        if (stats && stats.count > 0) {
            const meanScore = stats.sum / stats.count;

            // Threshold: Only consider if score > 0.4 (e.g. moderate/high)
            if (meanScore > 0.4) {
                candidates.push({
                    driverFamily: driver,
                    contributionScore: meanScore, // Real Score
                    confidence: 0.8, // Placeholder confidence (could derive from variance)
                    volatility: 0.1,
                    trendDelta: 0,
                });
            }
        }
    }

    // Sort by contribution score descending
    candidates.sort((a, b) => b.contributionScore - a.contributionScore);

    return candidates.slice(0, 3); // Top 3
}

function buildSeriesSnapshot(
    seriesResult: ReturnType<typeof buildTeamIndexSeries>
): SeriesSnapshot {
    const points: SeriesPointSnapshot[] = [];
    const strainSeries = seriesResult.series.find(s => s.indexKey === 'strain');

    if (strainSeries) {
        for (let i = 0; i < strainSeries.points.length; i++) {
            const weekStart = strainSeries.points[i].weekStart;

            const getVal = (indexKey: string): number => {
                const s = seriesResult.series.find(x => x.indexKey === indexKey);
                return s?.points[i]?.value ?? 0.5;
            };

            const getValSafe = (indexKey: string): number => {
                const v = getVal(indexKey);
                return isNaN(v) ? 0.5 : v;
            }

            points.push({
                weekStart,
                strain: getValSafe('strain'),
                withdrawalRisk: getValSafe('withdrawal_risk'),
                trustGap: getValSafe('trust_gap'),
                engagement: getValSafe('engagement'),
            });
        }
    }

    return {
        weeks: points.length,
        points,
    };
}

function extractLatestIndices(
    seriesResult: ReturnType<typeof buildTeamIndexSeries>
): Record<string, number> {
    const indices: Record<string, number> = {};

    for (const series of seriesResult.series) {
        if (series.points.length > 0) {
            indices[series.indexKey] = series.points[series.points.length - 1].value;
        }
    }

    return indices;
}

async function upsertWeeklyProduct(data: {
    orgId: string;
    teamId: string;
    weekStartStr: string;
    inputHash: string;
    teamState: any;
    quality: any;
    indices: any;
    series: any;
    attribution: any;
}): Promise<void> {
    await query(
        `INSERT INTO org_aggregates_weekly 
       (org_id, team_id, week_start, compute_version, input_hash, team_state, indices, quality, series, attribution, updated_at)
     VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, NOW())
     ON CONFLICT (org_id, team_id, week_start)
     DO UPDATE SET
       compute_version = $4,
       input_hash = $5,
       team_state = $6,
       indices = $7,
       quality = $8,
       series = $9,
       attribution = $10,
       updated_at = NOW()`,
        [
            data.orgId,
            data.teamId,
            data.weekStartStr,
            COMPUTE_VERSION,
            data.inputHash,
            JSON.stringify(data.teamState),
            JSON.stringify(data.indices),
            JSON.stringify(data.quality),
            JSON.stringify(data.series),
            JSON.stringify(data.attribution),
        ]
    );
}


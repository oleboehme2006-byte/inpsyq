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

    // 10. Snapshot Employee Profiles
    await saveEmployeeSnapshots(orgId, teamId, weekStart, gathered.userMeasurements);

    return { upserted: true, inputHash, skipped: false };
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

    // Compute precision-weighted mean across all users for each parameter
    // (Inverse Variance Weighting: users with less uncertainty count more)
    const paramAcc: Record<string, { weightedSum: number; precisionSum: number; count: number }> = {};

    for (const user of gathered.userMeasurements) {
        for (const [param, value] of Object.entries(user.parameterMeans)) {
            if (!paramAcc[param]) {
                paramAcc[param] = { weightedSum: 0, precisionSum: 0, count: 0 };
            }
            const variance = user.parameterVariance[param] || 0.1; // floor to avoid div-by-zero
            const precision = 1 / Math.max(variance, 0.01);
            paramAcc[param].weightedSum += value * precision;
            paramAcc[param].precisionSum += precision;
            paramAcc[param].count++;
        }
    }

    // Map parameters to indices
    const indexMapping: Record<string, string[]> = {
        strain: ['emotional_load', 'cognitive_dissonance'],
        withdrawal_risk: ['emotional_load', 'meaning'],
        trust_gap: ['trust_leadership', 'trust_peers', 'psychological_safety'],
        engagement: ['meaning', 'autonomy', 'control'],
    };

    for (const [indexKey, params] of Object.entries(indexMapping)) {
        let indexSum = 0;
        let indexCount = 0;
        let sigmaSum = 0;

        for (const param of params) {
            if (paramAcc[param]) {
                const mean = paramAcc[param].weightedSum / paramAcc[param].precisionSum;
                const combinedVariance = 1 / paramAcc[param].precisionSum;
                indexSum += mean;
                indexCount++;
                sigmaSum += Math.sqrt(combinedVariance);
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
    // 1. Define Driver Mappings (Parameter -> Index) & Polarity
    // High=Bad: 'high_bad' (e.g. Load). Low=Bad: 'low_bad' (e.g. Autonomy).
    const driverDefs: Record<IndexId, Array<{ param: string; dir: 'high_bad' | 'low_bad'; label: string }>> = {
        strain: [
            { param: 'emotional_load', dir: 'high_bad', label: 'Emotional Load' },
            { param: 'cognitive_dissonance', dir: 'high_bad', label: 'Cognitive Dissonance' }
        ],
        withdrawal_risk: [
            { param: 'meaning', dir: 'low_bad', label: 'Lack of Meaning' },
            { param: 'emotional_load', dir: 'high_bad', label: 'Burnout Risk' }
        ],
        trust_gap: [
            { param: 'trust_leadership', dir: 'low_bad', label: 'Leadership Trust' },
            { param: 'trust_peers', dir: 'low_bad', label: 'Peer Trust' },
            { param: 'psychological_safety', dir: 'low_bad', label: 'Psychological Safety' }
        ],
        engagement: [
            { param: 'autonomy', dir: 'low_bad', label: 'Autonomy Friction' },
            { param: 'control', dir: 'low_bad', label: 'Perceived Control' },
            { param: 'meaning', dir: 'low_bad', label: 'Meaning' }
        ]
    };

    const definitions = driverDefs[indexKey] || [];
    const candidates: any[] = [];

    // 2. Score each candidate based on User Data
    for (const def of definitions) {
        let totalImpact = 0;
        let count = 0;

        for (const user of gathered.userMeasurements) {
            const val = user.parameterMeans[def.param];
            if (val !== undefined) {
                // Calculate "Badness" (0 to 1)
                const impact = def.dir === 'high_bad' ? val : (1 - val);
                totalImpact += impact;
                count++;
            }
        }

        if (count > 0) {
            const avgImpact = totalImpact / count;

            // Only consider significant drivers (> 0.4 impact)
            if (avgImpact > 0.4) {
                candidates.push({
                    driverFamily: def.param, // Use parameter key as ID
                    label: def.label,        // Human readable
                    contributionScore: avgImpact, // REAL Score
                    confidence: 0.8,         // High confidence (measured)
                    volatility: 0.1,
                    trendDelta: 0,
                });
            }
        }
    }

    // Sort by impact (descending)
    return candidates.sort((a, b) => b.contributionScore - a.contributionScore).slice(0, 3);
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

            points.push({
                weekStart,
                strain: getVal('strain'),
                withdrawalRisk: getVal('withdrawal_risk'),
                trustGap: getVal('trust_gap'),
                engagement: getVal('engagement'),
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

async function saveEmployeeSnapshots(
    orgId: string,
    teamId: string,
    weekStart: Date,
    userMeasurements: any[]
): Promise<void> {
    const weekStartStr = toWeekStartISO(getISOMondayUTC(weekStart));

    for (const user of userMeasurements) {
        // Save to employee_profiles (existing behavior)
        await query(
            `INSERT INTO employee_profiles
             (user_id, org_id, team_id, week_start, parameter_means, parameter_uncertainty, profile_type_scores, confidence, created_at, updated_at)
             VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, NOW(), NOW())
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
                JSON.stringify({}),
                0.8
            ]
        );

        // Item 2.6: Also snapshot to latent_states_history for historical analysis
        for (const [param, mean] of Object.entries(user.parameterMeans as Record<string, number>)) {
            const variance = (user.parameterVariance as Record<string, number>)[param] || 0.1;
            await query(
                `INSERT INTO latent_states_history (user_id, week_start, parameter, mean, variance)
                 VALUES ($1, $2::date, $3, $4, $5)
                 ON CONFLICT (user_id, week_start, parameter)
                 DO UPDATE SET mean = $4, variance = $5, snapshot_at = NOW()`,
                [user.userId, weekStartStr, param, mean, variance]
            );
        }
    }
}

/**
 * Aggregate all Teams for an Org into a single Org-Level Stats row.
 */
export async function runWeeklyOrgRollup(orgId: string, weekStart: Date): Promise<void> {
    const weekStartStr = toWeekStartISO(getISOMondayUTC(weekStart));

    // 1. Fetch ALL teams for this org (including those without data)
    const teamsResult = await query(
        `SELECT team_id FROM teams WHERE org_id = $1`,
        [orgId]
    );

    // 2. Fetch team aggregates for this week
    const result = await query(
        `SELECT team_id, indices, quality, team_state
         FROM org_aggregates_weekly
         WHERE org_id = $1 AND week_start = $2::date`,
        [orgId, weekStartStr]
    );

    // Build lookup of teams with data
    const dataByTeam: Record<string, any> = {};
    for (const row of result.rows) {
        dataByTeam[row.team_id] = row;
    }

    if (teamsResult.rows.length === 0) return;

    let totalRespondents = 0;
    const sums: Record<string, number> = { strain: 0, withdrawal_risk: 0, trust_gap: 0, engagement: 0 };
    const counts: Record<string, number> = { strain: 0, withdrawal_risk: 0, trust_gap: 0, engagement: 0 };

    // Status Distribution (Item 2.10: includes teams with no data as 'unknown')
    const statusDist: Record<string, number> = { critical: 0, at_risk: 0, healthy: 0, unknown: 0 };

    for (const teamRow of teamsResult.rows) {
        const row = dataByTeam[teamRow.team_id];

        if (!row) {
            // Ghost team: exists but has no pipeline data this week
            statusDist['unknown']++;
            continue;
        }

        const teamN = (row.quality as any)?.sampleSize || 0;
        const indices = row.indices as any;
        const status = (row.team_state as any)?.status || 'unknown';

        // Update Status Dist
        const normStatus = status.toLowerCase().replace(' ', '_');
        if (statusDist[normStatus] !== undefined) statusDist[normStatus]++;
        else statusDist['unknown']++;

        totalRespondents += teamN;

        // Weighted Sums for Indices
        if (teamN > 0 && indices) {
            for (const key of ['strain', 'withdrawal_risk', 'trust_gap', 'engagement']) {
                if (typeof indices[key] === 'number') {
                    sums[key] += indices[key] * teamN;
                    counts[key] += teamN;
                }
            }
        }
    }

    // Calculate Averages
    const finalIndices: any = {};
    for (const key of ['strain', 'withdrawal_risk', 'trust_gap', 'engagement']) {
        finalIndices[key] = counts[key] > 0 ? sums[key] / counts[key] : 0;
    }

    // 2. Upsert Org Stats
    await query(
        `INSERT INTO org_stats_weekly
         (org_id, week_start, strain_score, withdrawal_score, trust_score, engagement_score, team_status_distribution, total_teams, total_respondents, updated_at)
         VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (org_id, week_start)
         DO UPDATE SET
            strain_score = $3,
            withdrawal_score = $4,
            trust_score = $5,
            engagement_score = $6,
            team_status_distribution = $7,
            total_teams = $8,
            total_respondents = $9,
            updated_at = NOW()`,
        [
            orgId,
            weekStartStr,
            finalIndices.strain,
            finalIndices.withdrawal_risk,
            finalIndices.trust_gap,
            finalIndices.engagement,
            JSON.stringify(statusDist),
            teamsResult.rows.length,
            totalRespondents
        ]
    );

    console.log(`[OrgRollup] Completed for ${orgId} Week ${weekStartStr}. Teams: ${result.rows.length}`);
}

/**
 * BUILD SERIES — Team Index Series Construction
 * 
 * Builds structured time series from raw aggregation inputs.
 * Pulls thresholds from INDEX_REGISTRY (Phase 1).
 * 
 * Output is DTO-ready for dashboard consumption.
 */

import { IndexId, INDEX_REGISTRY, getIndexDefinition } from '../semantics/indexRegistry';
import {
    AggregationInputs,
    WeeklyIndexPoint,
    WeeklyTeamIndexSeries,
    TeamTemporalState,
    DataQualityWeekly,
    TeamSeriesResult,
    IndexThresholdsView,
    normalizeToUnit,
} from './types';
import { listWeeksBackChronological, weekStartISO, assertWeekStartISO } from './week';
import {
    computeDelta,
    computeTrendDir,
    computeVolatility,
    computeRegime,
    computeTemporalStability,
    computeMissingness,
    computeWeightedConfidence,
} from './temporal';

// ============================================================================
// Constants
// ============================================================================

/** Canonical ordering of indices for consistent output */
const INDEX_ORDER: readonly IndexId[] = [
    'strain',
    'withdrawal_risk',
    'trust_gap',
    'engagement',
] as const;

/** Minimum sample size to consider week as "covered" */
const MIN_SAMPLE_SIZE = 3;

// ============================================================================
// Main Builder
// ============================================================================

/**
 * Build team index series from aggregation inputs.
 * 
 * @param inputs - Raw aggregation data
 * @param weeksBack - Number of weeks to include (from most recent)
 * @param referenceWeek - Optional reference week (defaults to most recent in data)
 */
export function buildTeamIndexSeries(
    inputs: AggregationInputs,
    weeksBack: number = 12,
    referenceWeek?: string
): TeamSeriesResult {
    // Determine reference week
    const weeks = Object.keys(inputs.perWeekIndexAggregates).sort();
    if (weeks.length === 0) {
        return buildEmptyResult();
    }

    const lastWeekStart = referenceWeek ?? weeks[weeks.length - 1];
    assertWeekStartISO(lastWeekStart);

    // Get the weeks to process (chronological order, oldest first)
    const targetWeeks = listWeeksBackChronological(lastWeekStart, weeksBack);

    // Build series for each index in canonical order
    const allSeries: WeeklyTeamIndexSeries[] = [];
    const allPoints: WeeklyIndexPoint[] = [];

    for (const indexKey of INDEX_ORDER) {
        const series = buildSingleIndexSeries(
            indexKey,
            inputs.perWeekIndexAggregates,
            targetWeeks
        );
        allSeries.push(series);
        allPoints.push(...series.points);
    }

    // Compute team temporal state (use strain as primary indicator)
    const strainSeries = allSeries.find(s => s.indexKey === 'strain');
    const strainPoints = strainSeries?.points ?? [];
    const strainDef = getIndexDefinition('strain');

    const volatility = computeVolatility(strainPoints);
    const missingness = computeMissingness(strainPoints, weeksBack);
    const riskThreshold = strainDef.riskThreshold;

    const regime = computeRegime(strainPoints, riskThreshold);
    const stability = computeTemporalStability(volatility, missingness);
    const coverageWeeks = strainPoints.filter(p => p.sampleN >= MIN_SAMPLE_SIZE).length;

    const teamState: TeamTemporalState = {
        coverageWeeks,
        lastWeekStart,
        regime,
        stability,
    };

    // Compute data quality
    const coverageRatio = coverageWeeks / weeksBack;
    const signalConfidence = computeWeightedConfidence(allPoints);
    const temporalStabilityValue = stabilityToValue(stability);

    const quality: DataQualityWeekly = {
        coverage: Math.max(0, Math.min(1, coverageRatio)),
        signalConfidence,
        temporalStability: temporalStabilityValue,
    };

    return {
        series: allSeries,
        teamState,
        quality,
    };
}

// ============================================================================
// Single Index Builder
// ============================================================================

function buildSingleIndexSeries(
    indexKey: IndexId,
    data: AggregationInputs['perWeekIndexAggregates'],
    weeks: readonly string[]
): WeeklyTeamIndexSeries {
    const indexDef = getIndexDefinition(indexKey);

    const points: WeeklyIndexPoint[] = [];
    let previousValue: number | null = null;

    for (const weekStart of weeks) {
        const weekData = data[weekStart]?.[indexKey];

        if (!weekData || weekData.sampleN === 0) {
            // Missing data point - still include but mark as missing
            points.push({
                weekStart,
                value: previousValue ?? 0.5, // Use previous or midpoint
                sigma: 0.25, // High uncertainty
                delta: 0,
                trendDir: 'STABLE',
                volatility: 0,
                sampleN: 0,
                confidence: 0,
            });
            continue;
        }

        // Normalize value to [0..1]
        const value = normalizeToUnit(weekData.mean);
        const sigma = normalizeToUnit(weekData.sigma);

        // Compute delta from previous
        const delta = previousValue !== null
            ? computeDelta(value, previousValue)
            : 0;

        const trendDir = computeTrendDir(delta);

        points.push({
            weekStart,
            value,
            sigma,
            delta,
            trendDir,
            volatility: 0, // Will be computed below
            sampleN: weekData.sampleN,
            confidence: weekData.confidence,
        });

        previousValue = value;
    }

    // Compute volatility for each point (trailing window)
    const pointsWithVolatility = points.map((point, index) => {
        const windowPoints = points.slice(Math.max(0, index - 3), index + 1);
        const volatility = computeVolatility(windowPoints);
        return { ...point, volatility };
    });

    // Build thresholds view from index definition
    const thresholds: IndexThresholdsView = {
        normal: indexDef.normalRange.max,
        risk: indexDef.riskThreshold,
        critical: indexDef.criticalThreshold,
    };

    return {
        indexKey,
        points: pointsWithVolatility,
        thresholds,
        directionality: indexDef.directionality,
    };
}

// ============================================================================
// Helpers
// ============================================================================

function buildEmptyResult(): TeamSeriesResult {
    return {
        series: INDEX_ORDER.map(indexKey => ({
            indexKey,
            points: [],
            thresholds: { normal: 0.35, risk: 0.6, critical: 0.75 },
            directionality: 'higher_is_worse' as const,
        })),
        teamState: {
            coverageWeeks: 0,
            lastWeekStart: weekStartISO(new Date()),
            regime: 'NOISE',
            stability: 'LOW',
        },
        quality: {
            coverage: 0,
            signalConfidence: 0,
            temporalStability: 0,
        },
    };
}

function stabilityToValue(stability: 'LOW' | 'MED' | 'HIGH'): number {
    switch (stability) {
        case 'LOW': return 0.25;
        case 'MED': return 0.6;
        case 'HIGH': return 0.9;
    }
}

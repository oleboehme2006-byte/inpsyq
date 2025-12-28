/**
 * BUILD ORG SERIES — Organization-Level Index Series Construction
 * 
 * Same concept as team series but for org-level aggregated data.
 * Includes team count tracking.
 */

import { IndexId, getIndexDefinition } from '../semantics/indexRegistry';
import {
    OrgAggregationInputs,
    WeeklyIndexPoint,
    WeeklyTeamIndexSeries,
    OrgTemporalState,
    DataQualityWeekly,
    OrgSeriesResult,
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

const INDEX_ORDER: readonly IndexId[] = [
    'strain',
    'withdrawal_risk',
    'trust_gap',
    'engagement',
] as const;

const MIN_SAMPLE_SIZE = 3;

// ============================================================================
// Main Builder
// ============================================================================

/**
 * Build org-level index series from aggregation inputs.
 */
export function buildOrgIndexSeries(
    inputs: OrgAggregationInputs,
    weeksBack: number = 12,
    referenceWeek?: string
): OrgSeriesResult {
    const weeks = Object.keys(inputs.perWeekIndexAggregates).sort();
    if (weeks.length === 0) {
        return buildEmptyOrgResult(inputs.teamsIncluded);
    }

    const lastWeekStart = referenceWeek ?? weeks[weeks.length - 1];
    assertWeekStartISO(lastWeekStart);

    const targetWeeks = listWeeksBackChronological(lastWeekStart, weeksBack);

    const allSeries: WeeklyTeamIndexSeries[] = [];
    const allPoints: WeeklyIndexPoint[] = [];

    for (const indexKey of INDEX_ORDER) {
        const series = buildSingleOrgIndexSeries(
            indexKey,
            inputs.perWeekIndexAggregates,
            targetWeeks
        );
        allSeries.push(series);
        allPoints.push(...series.points);
    }

    // Compute org temporal state
    const strainSeries = allSeries.find(s => s.indexKey === 'strain');
    const strainPoints = strainSeries?.points ?? [];
    const strainDef = getIndexDefinition('strain');

    const volatility = computeVolatility(strainPoints);
    const missingness = computeMissingness(strainPoints, weeksBack);
    const riskThreshold = strainDef.riskThreshold;

    const regime = computeRegime(strainPoints, riskThreshold);
    const stability = computeTemporalStability(volatility, missingness);
    const coverageWeeks = strainPoints.filter(p => p.sampleN >= MIN_SAMPLE_SIZE).length;

    const orgState: OrgTemporalState = {
        coverageWeeks,
        lastWeekStart,
        regime,
        stability,
        teamsIncluded: inputs.teamsIncluded,
    };

    const quality: DataQualityWeekly = {
        coverage: Math.max(0, Math.min(1, coverageWeeks / weeksBack)),
        signalConfidence: computeWeightedConfidence(allPoints),
        temporalStability: stabilityToValue(stability),
    };

    return {
        series: allSeries,
        orgState,
        quality,
    };
}

// ============================================================================
// Single Index Builder
// ============================================================================

function buildSingleOrgIndexSeries(
    indexKey: IndexId,
    data: OrgAggregationInputs['perWeekIndexAggregates'],
    weeks: readonly string[]
): WeeklyTeamIndexSeries {
    const indexDef = getIndexDefinition(indexKey);

    const points: WeeklyIndexPoint[] = [];
    let previousValue: number | null = null;

    for (const weekStart of weeks) {
        const weekData = data[weekStart]?.[indexKey];

        if (!weekData || weekData.sampleN === 0) {
            points.push({
                weekStart,
                value: previousValue ?? 0.5,
                sigma: 0.25,
                delta: 0,
                trendDir: 'STABLE',
                volatility: 0,
                sampleN: 0,
                confidence: 0,
            });
            continue;
        }

        const value = normalizeToUnit(weekData.mean);
        const sigma = normalizeToUnit(weekData.sigma);
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
            volatility: 0,
            sampleN: weekData.sampleN,
            confidence: weekData.confidence,
        });

        previousValue = value;
    }

    // Compute volatility
    const pointsWithVolatility = points.map((point, index) => {
        const windowPoints = points.slice(Math.max(0, index - 3), index + 1);
        const volatility = computeVolatility(windowPoints);
        return { ...point, volatility };
    });

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

function buildEmptyOrgResult(teamsIncluded: number): OrgSeriesResult {
    return {
        series: INDEX_ORDER.map(indexKey => ({
            indexKey,
            points: [],
            thresholds: { normal: 0.35, risk: 0.6, critical: 0.75 },
            directionality: 'higher_is_worse' as const,
        })),
        orgState: {
            coverageWeeks: 0,
            lastWeekStart: weekStartISO(new Date()),
            regime: 'NOISE',
            stability: 'LOW',
            teamsIncluded,
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

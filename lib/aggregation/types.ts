/**
 * AGGREGATION TYPES — Weekly Aggregation Data Structures
 * 
 * Core types for deterministic weekly aggregation of index data.
 * All value ranges are [0..1] internally. Input adapters handle normalization.
 */

import { IndexId, Directionality } from '../semantics/indexRegistry';

// ============================================================================
// Temporal Identifiers
// ============================================================================

/** ISO week start string in format YYYY-MM-DD (always Monday UTC) */
export type WeekStartISO = string;

// ============================================================================
// Trend & Regime Types
// ============================================================================

export type TrendDirection = 'UP' | 'DOWN' | 'STABLE';

export type Regime = 'NOISE' | 'EMERGING' | 'PERSISTENT';

export type StabilityLevel = 'LOW' | 'MED' | 'HIGH';

// ============================================================================
// Weekly Data Points
// ============================================================================

export interface WeeklyIndexPoint {
    readonly weekStart: WeekStartISO;
    /** Normalized value [0..1] */
    readonly value: number;
    /** Standard deviation / uncertainty [0..1] */
    readonly sigma: number;
    /** Week-over-week delta [-1..1] */
    readonly delta: number;
    readonly trendDir: TrendDirection;
    /** Volatility over recent window [0..1] */
    readonly volatility: number;
    /** Sample size for this week (0 if missing) */
    readonly sampleN: number;
    /** Confidence in this data point [0..1] */
    readonly confidence: number;
}

export interface IndexThresholdsView {
    readonly normal: number;
    readonly risk: number;
    readonly critical: number;
}

export interface WeeklyTeamIndexSeries {
    readonly indexKey: IndexId;
    readonly points: readonly WeeklyIndexPoint[];
    readonly thresholds: IndexThresholdsView;
    readonly directionality: Directionality;
}

// ============================================================================
// Temporal State
// ============================================================================

export interface TeamTemporalState {
    readonly coverageWeeks: number;
    readonly lastWeekStart: WeekStartISO;
    readonly regime: Regime;
    readonly stability: StabilityLevel;
}

export interface OrgTemporalState {
    readonly coverageWeeks: number;
    readonly lastWeekStart: WeekStartISO;
    readonly regime: Regime;
    readonly stability: StabilityLevel;
    readonly teamsIncluded: number;
}

// ============================================================================
// Data Quality
// ============================================================================

export interface DataQualityWeekly {
    /** Fraction of weeks with sufficient sample [0..1] */
    readonly coverage: number;
    /** Weighted mean confidence across indices [0..1] */
    readonly signalConfidence: number;
    /** Temporal stability indicator [0..1] */
    readonly temporalStability: number;
}

// ============================================================================
// Input Contract
// ============================================================================

export interface WeeklyIndexAggregate {
    readonly mean: number;
    readonly sigma: number;
    readonly sampleN: number;
    readonly confidence: number;
}

export interface PerWeekData {
    readonly [weekStart: string]: {
        readonly [indexKey: string]: WeeklyIndexAggregate;
    };
}

export interface AggregationInputs {
    readonly teamId: string;
    readonly orgId: string;
    /** Map of weekStart -> indexKey -> aggregate data */
    readonly perWeekIndexAggregates: PerWeekData;
}

export interface OrgAggregationInputs {
    readonly orgId: string;
    /** Aggregated across teams */
    readonly perWeekIndexAggregates: PerWeekData;
    readonly teamsIncluded: number;
}

// ============================================================================
// Build Results
// ============================================================================

export interface TeamSeriesResult {
    readonly series: readonly WeeklyTeamIndexSeries[];
    readonly teamState: TeamTemporalState;
    readonly quality: DataQualityWeekly;
}

export interface OrgSeriesResult {
    readonly series: readonly WeeklyTeamIndexSeries[];
    readonly orgState: OrgTemporalState;
    readonly quality: DataQualityWeekly;
}

// ============================================================================
// Value Normalization
// ============================================================================

/**
 * Normalize a value to [0..1] range.
 * Handles both [0..1] and [0..100] input ranges.
 */
export function normalizeToUnit(value: number, inputMax: 1 | 100 = 1): number {
    if (inputMax === 100) {
        return Math.max(0, Math.min(1, value / 100));
    }
    return Math.max(0, Math.min(1, value));
}

/**
 * Assert a value is in [0..1] range.
 */
export function assertUnitRange(value: number, name: string): void {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`${name} must be a number, got: ${typeof value}`);
    }
    if (value < 0 || value > 1) {
        throw new Error(`${name} must be in [0, 1], got: ${value}`);
    }
}

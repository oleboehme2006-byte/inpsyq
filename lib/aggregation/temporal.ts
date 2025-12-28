/**
 * TEMPORAL METRICS — Deterministic Time Series Analysis
 * 
 * Computes trend direction, volatility, regime classification,
 * and stability indicators from weekly data points.
 * 
 * All computations are DETERMINISTIC — same inputs produce same outputs.
 */

import { TrendDirection, Regime, StabilityLevel, WeeklyIndexPoint } from './types';

// ============================================================================
// Thresholds
// ============================================================================

const THRESHOLDS = {
    // Trend detection
    TREND_EPSILON: 0.02,        // Minimum delta to consider as UP/DOWN

    // Regime classification
    MIN_COVERAGE_WEEKS: 3,      // Minimum weeks for non-NOISE regime
    FLAT_VOLATILITY: 0.05,      // Below this = flat signal
    FLAT_DELTA: 0.02,           // Below this = no trend
    EMERGING_DELTA: 0.03,       // Minimum delta for EMERGING
    PERSISTENT_WEEKS: 4,        // Weeks for PERSISTENT via same-sign deltas
    PERSISTENT_AT_RISK_WEEKS: 2, // Weeks beyond threshold for PERSISTENT

    // Volatility window
    VOLATILITY_WINDOW: 4,

    // Stability thresholds
    STABILITY_HIGH_VOLATILITY: 0.15,
    STABILITY_LOW_VOLATILITY: 0.05,
    MISSINGNESS_HIGH: 0.3,      // More than 30% missing = lower stability
} as const;

// ============================================================================
// Basic Computations
// ============================================================================

/**
 * Compute week-over-week delta.
 * Range: [-1, 1] for normalized values.
 */
export function computeDelta(currentValue: number, previousValue: number): number {
    return currentValue - previousValue;
}

/**
 * Compute trend direction from delta.
 */
export function computeTrendDir(
    delta: number,
    epsilon: number = THRESHOLDS.TREND_EPSILON
): TrendDirection {
    if (delta > epsilon) return 'UP';
    if (delta < -epsilon) return 'DOWN';
    return 'STABLE';
}

/**
 * Compute volatility as standard deviation over a window.
 * Returns 0 if insufficient data points.
 */
export function computeVolatility(
    points: readonly WeeklyIndexPoint[],
    window: number = THRESHOLDS.VOLATILITY_WINDOW
): number {
    // Take the last `window` points with valid values
    const validPoints = points
        .slice(-window)
        .filter(p => p.sampleN > 0);

    if (validPoints.length < 2) return 0;

    const values = validPoints.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
}

/**
 * Compute volatility from raw values array.
 */
export function computeVolatilityFromValues(
    values: readonly number[],
    window: number = THRESHOLDS.VOLATILITY_WINDOW
): number {
    const slice = values.slice(-window);
    if (slice.length < 2) return 0;

    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / slice.length;

    return Math.sqrt(variance);
}

// ============================================================================
// Regime Classification
// ============================================================================

/**
 * Compute regime from time series data.
 * 
 * NOISE: insufficient weeks OR (low volatility AND flat delta)
 * EMERGING: last 2 deltas same sign AND lastDelta >= threshold
 * PERSISTENT: last 4 deltas same sign OR value beyond risk for >= 2 weeks
 */
export function computeRegime(
    points: readonly WeeklyIndexPoint[],
    riskThreshold?: number
): Regime {
    const validPoints = points.filter(p => p.sampleN > 0);

    // Rule 1: NOISE if insufficient coverage
    if (validPoints.length < THRESHOLDS.MIN_COVERAGE_WEEKS) {
        return 'NOISE';
    }

    // Get recent deltas (last 4)
    const recentPoints = validPoints.slice(-4);
    const deltas = recentPoints.map(p => p.delta);
    const lastDelta = deltas[deltas.length - 1] ?? 0;

    // Compute overall volatility
    const volatility = computeVolatility(points);

    // Rule 2: NOISE if nearly flat (low volatility AND small delta)
    if (
        volatility < THRESHOLDS.FLAT_VOLATILITY &&
        Math.abs(lastDelta) < THRESHOLDS.FLAT_DELTA
    ) {
        return 'NOISE';
    }

    // Rule 3: Check PERSISTENT via same-sign deltas
    if (deltas.length >= THRESHOLDS.PERSISTENT_WEEKS) {
        const lastFour = deltas.slice(-THRESHOLDS.PERSISTENT_WEEKS);
        const allSameSign = lastFour.every(d => d > 0) || lastFour.every(d => d < 0);
        if (allSameSign) {
            return 'PERSISTENT';
        }
    }

    // Rule 4: Check PERSISTENT via sustained risk
    if (riskThreshold !== undefined && validPoints.length >= THRESHOLDS.PERSISTENT_AT_RISK_WEEKS) {
        const lastTwo = validPoints.slice(-THRESHOLDS.PERSISTENT_AT_RISK_WEEKS);
        // Check if all are beyond risk threshold
        // Note: This assumes higher_is_worse; caller should pass correctly
        const allBeyondRisk = lastTwo.every(p => p.value >= riskThreshold);
        if (allBeyondRisk) {
            return 'PERSISTENT';
        }
    }

    // Rule 5: Check EMERGING
    if (deltas.length >= 2) {
        const lastTwo = deltas.slice(-2);
        const sameSign = (lastTwo[0] > 0 && lastTwo[1] > 0) || (lastTwo[0] < 0 && lastTwo[1] < 0);
        if (sameSign && Math.abs(lastDelta) >= THRESHOLDS.EMERGING_DELTA) {
            return 'EMERGING';
        }
    }

    // Default: NOISE
    return 'NOISE';
}

// ============================================================================
// Stability Classification
// ============================================================================

/**
 * Compute temporal stability from volatility and missingness.
 * 
 * HIGH: low volatility AND low missingness
 * LOW: high volatility OR high missingness
 * MED: otherwise
 */
export function computeTemporalStability(
    volatility: number,
    missingness: number
): StabilityLevel {
    // High missingness always reduces stability
    if (missingness >= THRESHOLDS.MISSINGNESS_HIGH) {
        return 'LOW';
    }

    // High volatility = low stability
    if (volatility >= THRESHOLDS.STABILITY_HIGH_VOLATILITY) {
        return 'LOW';
    }

    // Low volatility + low missingness = high stability
    if (volatility <= THRESHOLDS.STABILITY_LOW_VOLATILITY && missingness < 0.1) {
        return 'HIGH';
    }

    return 'MED';
}

/**
 * Compute missingness ratio from points.
 */
export function computeMissingness(
    points: readonly WeeklyIndexPoint[],
    expectedWeeks: number
): number {
    if (expectedWeeks <= 0) return 0;
    const missingCount = points.filter(p => p.sampleN === 0).length;
    const actualMissing = expectedWeeks - points.length + missingCount;
    return Math.max(0, Math.min(1, actualMissing / expectedWeeks));
}

// ============================================================================
// Aggregate Metrics
// ============================================================================

/**
 * Compute weighted average of confidence values.
 */
export function computeWeightedConfidence(
    points: readonly WeeklyIndexPoint[]
): number {
    const validPoints = points.filter(p => p.sampleN > 0);
    if (validPoints.length === 0) return 0;

    // Weight by sample size
    let totalWeight = 0;
    let weightedSum = 0;

    for (const p of validPoints) {
        totalWeight += p.sampleN;
        weightedSum += p.confidence * p.sampleN;
    }

    if (totalWeight === 0) return 0;
    return Math.max(0, Math.min(1, weightedSum / totalWeight));
}

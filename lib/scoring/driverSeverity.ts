/**
 * DRIVER SEVERITY ENGINE — Deterministic Severity Computation
 * 
 * Computes severity levels for internal drivers based on:
 * - Contribution score (how much the driver affects the index)
 * - Trend delta (direction of change)
 * - Confidence (measurement certainty)
 * - Volatility (signal stability)
 * 
 * RULES (all documented as comments in computation):
 * 1. High contribution + negative trend → increases severity
 * 2. Low confidence → caps severity at C2 maximum
 * 3. Volatility amplifies but NEVER creates severity alone
 */

import {
    DriverSeverityInput,
    DriverSeverityResult,
    DriverSeverityLevel,
    SeverityRationaleCode,
    validateDriverSeverityInput,
} from './types';

// ============================================================================
// Thresholds
// ============================================================================

const THRESHOLDS = {
    // Contribution thresholds
    CONTRIBUTION_LOW: 0.2,      // Below this = no concern
    CONTRIBUTION_MODERATE: 0.4, // Above this = moderate concern
    CONTRIBUTION_HIGH: 0.6,     // Above this = high concern
    CONTRIBUTION_CRITICAL: 0.8, // Above this = critical regardless of trend

    // Trend thresholds
    TREND_WORSENING: -0.1,      // Below this = worsening trend
    TREND_IMPROVING: 0.1,       // Above this = improving trend

    // Confidence thresholds
    CONFIDENCE_LOW: 0.5,        // Below this = cap severity

    // Volatility thresholds
    VOLATILITY_HIGH: 0.6,       // Above this = amplify severity
} as const;

// ============================================================================
// Core Computation
// ============================================================================

/**
 * Compute driver severity from input signals.
 * This function is DETERMINISTIC — same inputs always produce same outputs.
 */
export function computeDriverSeverity(
    input: DriverSeverityInput
): DriverSeverityResult {
    // Validate inputs (throws on invalid)
    validateDriverSeverityInput(input);

    const { contributionScore, trendDelta, confidence, volatility } = input;

    let severityLevel: DriverSeverityLevel;
    let rationaleCode: SeverityRationaleCode;
    let confidenceCapped = false;

    // =========================================================================
    // RULE 1: Determine base severity from contribution score
    // =========================================================================

    if (contributionScore < THRESHOLDS.CONTRIBUTION_LOW) {
        // Very low contribution → no concern
        severityLevel = 'C0';
        rationaleCode = 'BASELINE_NO_SIGNAL';
    } else if (contributionScore < THRESHOLDS.CONTRIBUTION_MODERATE) {
        // Low contribution → monitor only
        severityLevel = 'C1';
        rationaleCode = 'LOW_CONTRIBUTION_STABLE';
    } else if (contributionScore < THRESHOLDS.CONTRIBUTION_HIGH) {
        // Moderate contribution → attention needed
        severityLevel = 'C2';
        rationaleCode = 'MODERATE_CONTRIBUTION';
    } else if (contributionScore >= THRESHOLDS.CONTRIBUTION_CRITICAL) {
        // RULE: Critical contribution → C3 regardless of trend
        // Very high contribution alone is cause for concern
        severityLevel = 'C3';
        rationaleCode = 'CRITICAL_CONTRIBUTION';
    } else {
        // High contribution → depends on trend
        severityLevel = 'C2';
        rationaleCode = 'HIGH_CONTRIBUTION_STABLE';
    }

    // =========================================================================
    // RULE 2: Trend adjustment (only for high contribution)
    // High contribution + worsening trend → escalate to C3
    // =========================================================================

    if (
        contributionScore >= THRESHOLDS.CONTRIBUTION_HIGH &&
        contributionScore < THRESHOLDS.CONTRIBUTION_CRITICAL &&
        trendDelta < THRESHOLDS.TREND_WORSENING
    ) {
        // Worsening trend with high contribution → escalate
        severityLevel = 'C3';
        rationaleCode = 'HIGH_CONTRIBUTION_WORSENING';
    }

    // =========================================================================
    // RULE 3: Volatility amplification
    // High volatility can escalate C1→C2 or C2→C3
    // But volatility ALONE (with low contribution) does NOT create severity
    // =========================================================================

    if (
        volatility >= THRESHOLDS.VOLATILITY_HIGH &&
        contributionScore >= THRESHOLDS.CONTRIBUTION_LOW // Must have some contribution
    ) {
        if (severityLevel === 'C1') {
            severityLevel = 'C2';
            rationaleCode = 'VOLATILITY_AMPLIFIED';
        } else if (severityLevel === 'C2' && contributionScore >= THRESHOLDS.CONTRIBUTION_MODERATE) {
            severityLevel = 'C3';
            rationaleCode = 'VOLATILITY_AMPLIFIED';
        }
        // C0 is NOT escalated by volatility (no contribution = no signal to amplify)
        // C3 stays C3
    }

    // =========================================================================
    // RULE 4: Confidence cap
    // Low confidence → cap at C2 maximum
    // We can't justify C3 (action required) with uncertain data
    // =========================================================================

    if (confidence < THRESHOLDS.CONFIDENCE_LOW && severityLevel === 'C3') {
        severityLevel = 'C2';
        rationaleCode = 'CONFIDENCE_CAPPED';
        confidenceCapped = true;
    }

    return {
        severityLevel,
        rationaleCode,
        contributionScore,
        confidenceCapped,
    };
}

// ============================================================================
// Batch Computation
// ============================================================================

/**
 * Compute severity for multiple drivers at once.
 */
export function computeMultipleDriverSeverities(
    inputs: DriverSeverityInput[]
): DriverSeverityResult[] {
    return inputs.map(computeDriverSeverity);
}

/**
 * Get the highest severity level from a list of results.
 */
export function getMaxSeverityLevel(
    results: DriverSeverityResult[]
): DriverSeverityLevel {
    const order: Record<DriverSeverityLevel, number> = {
        C0: 0,
        C1: 1,
        C2: 2,
        C3: 3,
    };

    let max: DriverSeverityLevel = 'C0';
    for (const result of results) {
        if (order[result.severityLevel] > order[max]) {
            max = result.severityLevel;
        }
    }
    return max;
}

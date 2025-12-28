/**
 * DEPENDENCY IMPACT ENGINE — Deterministic Impact Computation
 * 
 * Computes impact levels for external dependencies based on:
 * - Impact score (how much the dependency affects indices)
 * - Controllability (how much can be done about it)
 * - Persistence (how long has it been present)
 * 
 * RULES:
 * 1. Low controllability caps action eligibility downstream
 * 2. Persistent dependencies increase impact even with moderate scores
 * 3. Impact is about constraint magnitude, not action generation
 */

import {
    DependencyImpactInput,
    DependencyImpactResult,
    DependencyImpactLevel,
    validateDependencyImpactInput,
} from './types';

// ============================================================================
// Thresholds
// ============================================================================

const THRESHOLDS = {
    // Impact score thresholds
    IMPACT_LOW: 0.3,      // Below this = D1
    IMPACT_MODERATE: 0.6, // Above this = D2 or D3

    // Persistence thresholds (in weeks)
    PERSISTENCE_CHRONIC: 4, // Above this = persistence adjustment applies
} as const;

// Controllability to max action eligibility mapping
const CONTROLLABILITY_CAPS: Record<'low' | 'medium' | 'high', number> = {
    low: 0.3,
    medium: 0.6,
    high: 1.0,
};

// ============================================================================
// Core Computation
// ============================================================================

/**
 * Compute dependency impact from input signals.
 * This function is DETERMINISTIC — same inputs always produce same outputs.
 */
export function computeDependencyImpact(
    input: DependencyImpactInput
): DependencyImpactResult {
    // Validate inputs (throws on invalid)
    validateDependencyImpactInput(input);

    const { impactScore, controllability, persistence } = input;

    let impactLevel: DependencyImpactLevel;
    let persistenceAdjusted = false;

    // =========================================================================
    // RULE 1: Determine base impact from impact score
    // =========================================================================

    if (impactScore < THRESHOLDS.IMPACT_LOW) {
        // Low impact → awareness only
        impactLevel = 'D1';
    } else if (impactScore < THRESHOLDS.IMPACT_MODERATE) {
        // Moderate impact → limits options
        impactLevel = 'D2';
    } else {
        // High impact → severely constrains action
        impactLevel = 'D3';
    }

    // =========================================================================
    // RULE 2: Persistence adjustment
    // Chronic dependencies escalate impact even with moderate scores
    // A D1 can become D2, a D2 can become D3
    // =========================================================================

    if (persistence >= THRESHOLDS.PERSISTENCE_CHRONIC) {
        if (impactLevel === 'D1' && impactScore >= THRESHOLDS.IMPACT_LOW * 0.5) {
            // Persistent low impact → escalate to D2
            impactLevel = 'D2';
            persistenceAdjusted = true;
        } else if (impactLevel === 'D2') {
            // Persistent moderate impact → escalate to D3
            impactLevel = 'D3';
            persistenceAdjusted = true;
        }
        // D3 stays D3
    }

    // =========================================================================
    // RULE 3: Calculate action eligibility cap from controllability
    // This caps what actions can be recommended downstream
    // =========================================================================

    const actionEligibilityCap = CONTROLLABILITY_CAPS[controllability];

    return {
        impactLevel,
        actionEligibilityCap,
        persistenceAdjusted,
    };
}

// ============================================================================
// Batch Computation
// ============================================================================

/**
 * Compute impact for multiple dependencies at once.
 */
export function computeMultipleDependencyImpacts(
    inputs: DependencyImpactInput[]
): DependencyImpactResult[] {
    return inputs.map(computeDependencyImpact);
}

/**
 * Get the highest impact level from a list of results.
 */
export function getMaxImpactLevel(
    results: DependencyImpactResult[]
): DependencyImpactLevel {
    const order: Record<DependencyImpactLevel, number> = {
        D1: 1,
        D2: 2,
        D3: 3,
    };

    let max: DependencyImpactLevel = 'D1';
    for (const result of results) {
        if (order[result.impactLevel] > order[max]) {
            max = result.impactLevel;
        }
    }
    return max;
}

/**
 * Get the minimum action eligibility cap from a list of results.
 * The most restrictive dependency determines the overall cap.
 */
export function getMinActionEligibilityCap(
    results: DependencyImpactResult[]
): number {
    if (results.length === 0) return 1.0;
    return Math.min(...results.map(r => r.actionEligibilityCap));
}

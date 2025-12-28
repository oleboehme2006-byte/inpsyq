/**
 * SOURCE RULES — Source Dominance / Mutual Exclusivity
 * 
 * Determines whether an index's pressure primarily comes from
 * INTERNAL drivers, EXTERNAL dependencies, or is MIXED.
 * 
 * When EXTERNAL dominates, internal list is cleared to prevent semantic confusion.
 */

import { PrimarySource, InternalDriverAttribution, ExternalDependencyAttribution } from './types';
import { InternalDriverCandidate, ExternalDependencyCandidate } from './input';

// ============================================================================
// Thresholds
// ============================================================================

const THRESHOLDS = {
    /** Mass threshold to be considered dominant */
    DOMINANT_MASS: 0.60,
    /** Mass threshold below which the source is negligible */
    NEGLIGIBLE_MASS: 0.35,
} as const;

/** Max drivers/deps in mixed mode */
const MIXED_MAX_INTERNAL = 3;
const MIXED_MAX_EXTERNAL = 2;

// ============================================================================
// Source Determination
// ============================================================================

export interface SourceDeterminationInput {
    readonly internalMass: number;
    readonly externalMass: number;
}

/**
 * Determine primary source based on mass comparison.
 * 
 * Rules:
 * - EXTERNAL if externalMass >= 0.60 AND internalMass < 0.35
 * - INTERNAL if internalMass >= 0.60 AND externalMass < 0.35
 * - MIXED otherwise
 */
export function determinePrimarySource(input: SourceDeterminationInput): PrimarySource {
    const { internalMass, externalMass } = input;

    // EXTERNAL dominance
    if (
        externalMass >= THRESHOLDS.DOMINANT_MASS &&
        internalMass < THRESHOLDS.NEGLIGIBLE_MASS
    ) {
        return 'EXTERNAL';
    }

    // INTERNAL dominance
    if (
        internalMass >= THRESHOLDS.DOMINANT_MASS &&
        externalMass < THRESHOLDS.NEGLIGIBLE_MASS
    ) {
        return 'INTERNAL';
    }

    // Mixed
    return 'MIXED';
}

// ============================================================================
// List Adjustment
// ============================================================================

export interface SourceAdjustmentResult {
    readonly primarySource: PrimarySource;
    readonly internal: readonly InternalDriverAttribution[];
    readonly external: readonly ExternalDependencyAttribution[];
}

/**
 * Adjust internal and external lists based on source dominance.
 * 
 * When EXTERNAL dominates: internal = [] (cleared to prevent confusion)
 * When MIXED: cap internal to 3, external to 2
 */
export function applySourceRules(
    primarySource: PrimarySource,
    internal: readonly InternalDriverAttribution[],
    external: readonly ExternalDependencyAttribution[]
): SourceAdjustmentResult {
    switch (primarySource) {
        case 'EXTERNAL':
            // Clear internal to prevent semantic confusion
            return {
                primarySource,
                internal: [],
                external,
            };

        case 'INTERNAL':
            // Keep internal as-is (already capped by internal.ts)
            return {
                primarySource,
                internal,
                external,
            };

        case 'MIXED':
            // Cap both to reduce clutter
            return {
                primarySource,
                internal: internal.slice(0, MIXED_MAX_INTERNAL),
                external: external.slice(0, MIXED_MAX_EXTERNAL),
            };
    }
}

/**
 * Calculate internal mass from candidates.
 */
export function calculateInternalMass(
    candidates: readonly InternalDriverCandidate[]
): number {
    return candidates.reduce((sum, c) => sum + c.contributionScore, 0);
}

/**
 * Calculate external mass from candidates.
 */
export function calculateExternalMass(
    candidates: readonly ExternalDependencyCandidate[]
): number {
    return candidates.reduce((sum, c) => sum + c.impactScore, 0);
}

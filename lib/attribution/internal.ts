/**
 * INTERNAL DRIVER ATTRIBUTION — Internal Driver Processing
 * 
 * Processes internal driver candidates:
 * - Validates driver→index mapping via driverRegistry
 * - Computes severity via computeDriverSeverity()
 * - Derives ContributionBand from score
 * - Prunes and sorts results
 */

import { IndexId, getIndexDefinition } from '../semantics/indexRegistry';
import { DriverFamilyId, validateDriverIndexAssignment, getDriverDefinition } from '../semantics/driverRegistry';
import { computeDriverSeverity } from '../scoring/driverSeverity';
import { getSeverityColor } from '../scoring/severityColors';
import { DriverSeverityLevel } from '../scoring/types';

import { InternalDriverCandidate } from './input';
import {
    InternalDriverAttribution,
    ContributionBand,
    scoreToContributionBand,
    volatilityToIndicator,
    trendDeltaToIndicator,
    invertTrendIndicator,
} from './types';

// ============================================================================
// Constants
// ============================================================================

/** Maximum internal drivers to keep */
const MAX_INTERNAL_DRIVERS = 4;

/** Severity ordering for sorting (higher = more severe) */
const SEVERITY_ORDER: Record<DriverSeverityLevel, number> = {
    C0: 0,
    C1: 1,
    C2: 2,
    C3: 3,
};

/** Contribution band ordering for sorting (higher = larger contribution) */
const BAND_ORDER: Record<ContributionBand, number> = {
    MINOR: 0,
    MODERATE: 1,
    MAJOR: 2,
};

// ============================================================================
// Main Processing
// ============================================================================

/**
 * Process internal driver candidates for a given index.
 * 
 * Steps:
 * 1. Validate each driver→index mapping (throws on forbidden)
 * 2. Compute severity for each valid driver
 * 3. Derive contribution band
 * 4. Prune MINOR unless no others exist
 * 5. Sort and limit to MAX_INTERNAL_DRIVERS
 */
export function processInternalDrivers(
    indexKey: IndexId,
    candidates: readonly InternalDriverCandidate[]
): InternalDriverAttribution[] {
    const indexDef = getIndexDefinition(indexKey);
    const isHigherWorse = indexDef.directionality === 'higher_is_worse';

    const attributions: InternalDriverAttribution[] = [];

    for (const candidate of candidates) {
        // Step 1: Validate driver→index mapping (throws if forbidden)
        validateDriverIndexAssignment(candidate.driverFamily, indexKey);

        // Step 2: Compute severity
        const severityResult = computeDriverSeverity({
            contributionScore: candidate.contributionScore,
            trendDelta: candidate.trendDelta,
            confidence: candidate.confidence,
            volatility: candidate.volatility,
        });

        // Step 3: Derive contribution band
        const contributionBand = scoreToContributionBand(candidate.contributionScore);

        // Step 4: Get color token (index-agnostic)
        const colorToken = getSeverityColor(severityResult.severityLevel);

        // Step 5: Build supporting signals
        let trendIndicator = trendDeltaToIndicator(candidate.trendDelta);
        // For higher_is_worse, positive delta = worsening (already correct)
        // For higher_is_better, positive delta = improving, so invert
        if (!isHigherWorse) {
            trendIndicator = invertTrendIndicator(trendIndicator);
        }

        const attribution: InternalDriverAttribution = {
            driverFamily: candidate.driverFamily,
            contributionBand,
            severity: severityResult.severityLevel,
            confidence: candidate.confidence,
            rationaleCode: severityResult.rationaleCode,
            colorToken,
            supportingSignals: {
                trend: trendIndicator,
                volatility: volatilityToIndicator(candidate.volatility),
            },
        };

        attributions.push(attribution);
    }

    // Step 6: Prune and sort
    return pruneAndSortDrivers(attributions);
}

// ============================================================================
// Pruning & Sorting
// ============================================================================

/**
 * Prune MINOR drivers (unless no others) and sort by importance.
 * Limit to MAX_INTERNAL_DRIVERS.
 */
function pruneAndSortDrivers(
    attributions: InternalDriverAttribution[]
): InternalDriverAttribution[] {
    // Separate by band
    const major = attributions.filter(a => a.contributionBand === 'MAJOR');
    const moderate = attributions.filter(a => a.contributionBand === 'MODERATE');
    const minor = attributions.filter(a => a.contributionBand === 'MINOR');

    // If no MAJOR or MODERATE, keep MINOR
    let result: InternalDriverAttribution[];
    if (major.length === 0 && moderate.length === 0) {
        result = minor;
    } else {
        // Prune MINOR, keep MAJOR and MODERATE
        result = [...major, ...moderate];
    }

    // Sort by: 1) contributionBand desc, 2) severity desc, 3) confidence desc
    result.sort((a, b) => {
        const bandDiff = BAND_ORDER[b.contributionBand] - BAND_ORDER[a.contributionBand];
        if (bandDiff !== 0) return bandDiff;

        const severityDiff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
        if (severityDiff !== 0) return severityDiff;

        return b.confidence - a.confidence;
    });

    // Limit
    return result.slice(0, MAX_INTERNAL_DRIVERS);
}

/**
 * Calculate total contribution mass from drivers.
 */
export function calculateInternalMass(
    candidates: readonly InternalDriverCandidate[]
): number {
    return candidates.reduce((sum, c) => sum + c.contributionScore, 0);
}

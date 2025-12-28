/**
 * ATTRIBUTION ENGINE — Main Entry Point
 * 
 * Computes complete attribution for an index, combining:
 * - Internal driver processing
 * - External dependency processing
 * - Source dominance rules
 * - Propagation risk
 * 
 * Output is semantically consistent and DTO-ready.
 */

import { getIndexDefinition } from '../semantics/indexRegistry';

import { AttributionInputs, validateAttributionInputs } from './input';
import { AttributionResult } from './types';
import { processInternalDrivers } from './internal';
import { processExternalDependencies } from './external';
import {
    determinePrimarySource,
    applySourceRules,
    calculateInternalMass,
    calculateExternalMass,
} from './sourceRules';
import { computePropagationRisk, isIndexWorsening } from './propagation';

// ============================================================================
// Main Engine
// ============================================================================

/**
 * Compute complete attribution for an index.
 * 
 * This is the main entry point for the attribution engine.
 * Input is validated, then processed through:
 * 1. Internal driver attribution
 * 2. External dependency attribution
 * 3. Source dominance determination
 * 4. Source rules application (clears internal if EXTERNAL dominant)
 * 5. Propagation risk computation
 */
export function computeAttribution(inputs: AttributionInputs): AttributionResult {
    // Step 0: Validate inputs
    validateAttributionInputs(inputs);

    const indexDef = getIndexDefinition(inputs.indexKey);
    const isHigherWorse = indexDef.directionality === 'higher_is_worse';

    // Step 1: Process internal drivers
    // This validates driver→index mapping and computes severity
    const internalAttributions = processInternalDrivers(
        inputs.indexKey,
        inputs.candidateInternalDrivers
    );

    // Step 2: Process external dependencies
    const externalAttributions = processExternalDependencies(
        inputs.candidateDependencies
    );

    // Step 3: Calculate mass for source determination
    const internalMass = calculateInternalMass(inputs.candidateInternalDrivers);
    const externalMass = calculateExternalMass(inputs.candidateDependencies);

    // Step 4: Determine primary source
    const primarySource = determinePrimarySource({
        internalMass,
        externalMass,
    });

    // Step 5: Apply source rules (may clear internal list)
    const adjusted = applySourceRules(
        primarySource,
        internalAttributions,
        externalAttributions
    );

    // Step 6: Compute propagation risk
    const worsening = isIndexWorsening(inputs.indexDelta, isHigherWorse);
    const propagationRisk = computePropagationRisk({
        dependencies: adjusted.external,
        candidates: inputs.candidateDependencies,
        isWorsening: worsening,
        volatility: inputs.volatility,
        isMixed: adjusted.primarySource === 'MIXED',
    });

    // Build final result
    return {
        indexKey: inputs.indexKey,
        primarySource: adjusted.primarySource,
        internal: adjusted.internal,
        external: adjusted.external,
        propagationRisk,
    };
}

/**
 * Compute attribution for multiple indices.
 * Convenience function for batch processing.
 */
export function computeMultipleAttributions(
    inputsList: readonly AttributionInputs[]
): AttributionResult[] {
    return inputsList.map(computeAttribution);
}

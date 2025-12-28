/**
 * ATTRIBUTION INPUT — Input Contract for Attribution Engine
 * 
 * Defines what the attribution engine consumes per team per week.
 * Phase 4 does NOT fetch from DB — it consumes prepared candidates.
 */

import { DriverFamilyId } from '../semantics/driverRegistry';
import { DependencyTypeId } from '../semantics/dependencyRegistry';
import { IndexId } from '../semantics/indexRegistry';

// ============================================================================
// Candidate Types
// ============================================================================

export interface InternalDriverCandidate {
    readonly driverFamily: DriverFamilyId;
    /** Contribution to the index [0..1] */
    readonly contributionScore: number;
    /** Measurement confidence [0..1] */
    readonly confidence: number;
    /** Signal volatility [0..1] */
    readonly volatility: number;
    /** Trend delta [-1..1], negative = improving for higher_is_worse */
    readonly trendDelta: number;
}

export interface ExternalDependencyCandidate {
    readonly dependency: DependencyTypeId;
    /** Impact score [0..1] */
    readonly impactScore: number;
    /** Measurement confidence [0..1] */
    readonly confidence: number;
    /** Signal volatility [0..1] */
    readonly volatility: number;
    /** Trend delta [-1..1] */
    readonly trendDelta: number;
    /** Duration in weeks */
    readonly persistenceWeeks: number;
}

// ============================================================================
// Main Input Contract
// ============================================================================

export interface AttributionInputs {
    /** Which index we are attributing */
    readonly indexKey: IndexId;

    /** Current index value [0..1] */
    readonly indexValue: number;
    /** Index uncertainty [0..1] */
    readonly indexSigma: number;
    /** Index week-over-week delta [-1..1] */
    readonly indexDelta: number;
    /** Overall confidence in index [0..1] */
    readonly indexConfidence: number;
    /** Index volatility [0..1] */
    readonly volatility: number;

    /** Candidate internal drivers */
    readonly candidateInternalDrivers: readonly InternalDriverCandidate[];
    /** Candidate external dependencies */
    readonly candidateDependencies: readonly ExternalDependencyCandidate[];
}

// ============================================================================
// Validation
// ============================================================================

function assertRange(value: number, min: number, max: number, name: string): void {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`${name} must be a number`);
    }
    if (value < min || value > max) {
        throw new Error(`${name} must be in [${min}, ${max}], got: ${value}`);
    }
}

/**
 * Validate attribution inputs.
 * Throws on invalid values.
 */
export function validateAttributionInputs(inputs: AttributionInputs): void {
    assertRange(inputs.indexValue, 0, 1, 'indexValue');
    assertRange(inputs.indexSigma, 0, 1, 'indexSigma');
    assertRange(inputs.indexDelta, -1, 1, 'indexDelta');
    assertRange(inputs.indexConfidence, 0, 1, 'indexConfidence');
    assertRange(inputs.volatility, 0, 1, 'volatility');

    for (const driver of inputs.candidateInternalDrivers) {
        assertRange(driver.contributionScore, 0, 1, 'driver.contributionScore');
        assertRange(driver.confidence, 0, 1, 'driver.confidence');
        assertRange(driver.volatility, 0, 1, 'driver.volatility');
        assertRange(driver.trendDelta, -1, 1, 'driver.trendDelta');
    }

    for (const dep of inputs.candidateDependencies) {
        assertRange(dep.impactScore, 0, 1, 'dependency.impactScore');
        assertRange(dep.confidence, 0, 1, 'dependency.confidence');
        assertRange(dep.volatility, 0, 1, 'dependency.volatility');
        assertRange(dep.trendDelta, -1, 1, 'dependency.trendDelta');
        if (dep.persistenceWeeks < 0 || !Number.isInteger(dep.persistenceWeeks)) {
            throw new Error('dependency.persistenceWeeks must be non-negative integer');
        }
    }
}

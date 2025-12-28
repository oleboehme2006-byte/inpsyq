/**
 * ATTRIBUTION TYPES — Driver Attribution Data Structures
 * 
 * Types for internal driver and external dependency attribution.
 * All types are DTO-ready for dashboard consumption.
 */

import { DriverFamilyId } from '../semantics/driverRegistry';
import { DependencyTypeId } from '../semantics/dependencyRegistry';
import { IndexId } from '../semantics/indexRegistry';
import { DriverSeverityLevel, DependencyImpactLevel, SeverityColorToken } from '../scoring/types';

// ============================================================================
// Contribution & Severity Types
// ============================================================================

/**
 * Contribution band replaces fake percentages.
 * MINOR: low contribution, may be pruned
 * MODERATE: notable contribution
 * MAJOR: primary contributor
 */
export type ContributionBand = 'MINOR' | 'MODERATE' | 'MAJOR';

/**
 * Controllability as display string.
 */
export type ControllabilityDisplay = 'LOW' | 'MED' | 'HIGH';

/**
 * Trend indicator for supporting signals.
 */
export type TrendIndicator = 'improving' | 'worsening' | 'stable';

/**
 * Volatility indicator.
 */
export type VolatilityIndicator = 'low' | 'med' | 'high';

/**
 * Primary source of index pressure.
 */
export type PrimarySource = 'INTERNAL' | 'EXTERNAL' | 'MIXED';

/**
 * Propagation risk level.
 */
export type PropagationRiskLevel = 'LOW' | 'ELEVATED' | 'HIGH';

// ============================================================================
// Internal Driver Attribution
// ============================================================================

export interface SupportingSignals {
    readonly trend: TrendIndicator;
    readonly volatility: VolatilityIndicator;
}

export interface InternalDriverAttribution {
    readonly driverFamily: DriverFamilyId;
    readonly contributionBand: ContributionBand;
    readonly severity: DriverSeverityLevel;
    readonly confidence: number;
    /** Rationale code from computeDriverSeverity */
    readonly rationaleCode: string;
    /** Color token from severityColors (index-agnostic) */
    readonly colorToken: SeverityColorToken;
    readonly supportingSignals: SupportingSignals;
}

// ============================================================================
// External Dependency Attribution
// ============================================================================

export interface ExternalDependencyAttribution {
    readonly dependency: DependencyTypeId;
    readonly impact: DependencyImpactLevel;
    readonly controllability: ControllabilityDisplay;
    readonly confidence: number;
    readonly colorToken: SeverityColorToken;
    /** Deterministic templated explanation of causal pathway */
    readonly pathway: string;
    /** Deterministic templated failure mode */
    readonly failureMode: string;
    /** Deterministic list of early warning signals */
    readonly earlySignals: readonly string[];
    /** Deterministic list of coordination levers */
    readonly coordinationLevers: readonly string[];
    /** Deterministic list of controllable factors */
    readonly whatWeControl: readonly string[];
}

// ============================================================================
// Propagation Risk
// ============================================================================

export interface PropagationRisk {
    readonly level: PropagationRiskLevel;
    /** Drivers/dependencies contributing to propagation risk */
    readonly drivers: readonly string[];
}

// ============================================================================
// Attribution Result
// ============================================================================

export interface AttributionResult {
    readonly indexKey: IndexId;
    readonly primarySource: PrimarySource;
    readonly internal: readonly InternalDriverAttribution[];
    readonly external: readonly ExternalDependencyAttribution[];
    readonly propagationRisk: PropagationRisk;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert contribution score [0..1] to ContributionBand.
 */
export function scoreToContributionBand(score: number): ContributionBand {
    if (score >= 0.60) return 'MAJOR';
    if (score >= 0.35) return 'MODERATE';
    return 'MINOR';
}

/**
 * Convert controllability string to display format.
 */
export function toControllabilityDisplay(
    controllability: 'low' | 'medium' | 'high'
): ControllabilityDisplay {
    switch (controllability) {
        case 'low': return 'LOW';
        case 'medium': return 'MED';
        case 'high': return 'HIGH';
    }
}

/**
 * Convert volatility [0..1] to display indicator.
 */
export function volatilityToIndicator(volatility: number): VolatilityIndicator {
    if (volatility >= 0.15) return 'high';
    if (volatility >= 0.05) return 'med';
    return 'low';
}

/**
 * Convert trend delta to indicator.
 */
export function trendDeltaToIndicator(delta: number): TrendIndicator {
    if (delta > 0.02) return 'worsening'; // For higher_is_worse indices
    if (delta < -0.02) return 'improving';
    return 'stable';
}

/**
 * Invert trend for higher_is_better indices.
 */
export function invertTrendIndicator(indicator: TrendIndicator): TrendIndicator {
    switch (indicator) {
        case 'improving': return 'worsening';
        case 'worsening': return 'improving';
        case 'stable': return 'stable';
    }
}

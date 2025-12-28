/**
 * SCORING TYPES — Shared Types for Severity & Impact Engine
 * 
 * Defines all types and runtime assertions for the deterministic scoring system.
 * This module is imported by all scoring engine files.
 */

// ============================================================================
// Severity Levels (Driver-based)
// ============================================================================

/**
 * Driver Severity Levels
 * C0 = No concern (baseline)
 * C1 = Low concern (monitor)
 * C2 = Moderate concern (attention required)
 * C3 = High concern (action required)
 */
export type DriverSeverityLevel = 'C0' | 'C1' | 'C2' | 'C3';

export const SEVERITY_LEVELS: readonly DriverSeverityLevel[] = ['C0', 'C1', 'C2', 'C3'];

export interface DriverSeverityResult {
    readonly severityLevel: DriverSeverityLevel;
    readonly rationaleCode: SeverityRationaleCode;
    readonly contributionScore: number;
    readonly confidenceCapped: boolean;
}

/**
 * Rationale codes explain WHY a severity level was assigned.
 * These are machine-readable codes, not user-facing text.
 */
export type SeverityRationaleCode =
    | 'BASELINE_NO_SIGNAL'           // C0: No significant contribution
    | 'LOW_CONTRIBUTION_STABLE'      // C1: Low contribution, stable trend
    | 'MODERATE_CONTRIBUTION'        // C2: Moderate contribution
    | 'HIGH_CONTRIBUTION_STABLE'     // C2: High contribution but stable
    | 'HIGH_CONTRIBUTION_WORSENING'  // C3: High contribution + negative trend
    | 'CRITICAL_CONTRIBUTION'        // C3: Very high contribution regardless of trend
    | 'VOLATILITY_AMPLIFIED'         // Level increased due to volatility
    | 'CONFIDENCE_CAPPED';           // Level capped due to low confidence

// ============================================================================
// Impact Levels (Dependency-based)
// ============================================================================

/**
 * Dependency Impact Levels
 * D1 = Low impact (awareness only)
 * D2 = Moderate impact (limits options)
 * D3 = High impact (severely constrains action)
 */
export type DependencyImpactLevel = 'D1' | 'D2' | 'D3';

export const IMPACT_LEVELS: readonly DependencyImpactLevel[] = ['D1', 'D2', 'D3'];

export interface DependencyImpactResult {
    readonly impactLevel: DependencyImpactLevel;
    readonly actionEligibilityCap: number;
    readonly persistenceAdjusted: boolean;
}

// ============================================================================
// Visual Mapping Types
// ============================================================================

/**
 * Severity color tokens (index-agnostic)
 * These map to CSS custom properties, not actual color values.
 */
export type SeverityColorToken =
    | 'severity-neutral'
    | 'severity-warning-subtle'
    | 'severity-warning-strong'
    | 'severity-critical';

/**
 * Priority tiers for rendering order and attention
 */
export type PriorityTier = 0 | 1 | 2 | 3;

// ============================================================================
// Input Types
// ============================================================================

export interface DriverSeverityInput {
    /** Normalized contribution score [0-1], how much this driver affects the index */
    readonly contributionScore: number;
    /** Trend delta [-1 to 1], negative = worsening, positive = improving */
    readonly trendDelta: number;
    /** Confidence in the measurement [0-1] */
    readonly confidence: number;
    /** Volatility of the signal [0-1], higher = more variability */
    readonly volatility: number;
}

export interface DependencyImpactInput {
    /** Normalized impact score [0-1] */
    readonly impactScore: number;
    /** Controllability level */
    readonly controllability: 'low' | 'medium' | 'high';
    /** Persistence: how long has this dependency existed (weeks) */
    readonly persistence: number;
}

// ============================================================================
// Runtime Assertions
// ============================================================================

/**
 * Assert that a value is within the valid [0-1] range.
 */
export function assertNormalizedValue(value: number, name: string): void {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`${name} must be a number, got: ${typeof value}`);
    }
    if (value < 0 || value > 1) {
        throw new Error(`${name} must be in range [0, 1], got: ${value}`);
    }
}

/**
 * Assert that a trend delta is within the valid [-1, 1] range.
 */
export function assertTrendDelta(value: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`trendDelta must be a number, got: ${typeof value}`);
    }
    if (value < -1 || value > 1) {
        throw new Error(`trendDelta must be in range [-1, 1], got: ${value}`);
    }
}

/**
 * Assert that persistence is a non-negative integer.
 */
export function assertPersistence(value: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`persistence must be a number, got: ${typeof value}`);
    }
    if (value < 0 || !Number.isInteger(value)) {
        throw new Error(`persistence must be a non-negative integer, got: ${value}`);
    }
}

/**
 * Validate all inputs for driver severity computation.
 */
export function validateDriverSeverityInput(input: DriverSeverityInput): void {
    assertNormalizedValue(input.contributionScore, 'contributionScore');
    assertTrendDelta(input.trendDelta);
    assertNormalizedValue(input.confidence, 'confidence');
    assertNormalizedValue(input.volatility, 'volatility');
}

/**
 * Validate all inputs for dependency impact computation.
 */
export function validateDependencyImpactInput(input: DependencyImpactInput): void {
    assertNormalizedValue(input.impactScore, 'impactScore');
    if (!['low', 'medium', 'high'].includes(input.controllability)) {
        throw new Error(
            `controllability must be 'low', 'medium', or 'high', got: ${input.controllability}`
        );
    }
    assertPersistence(input.persistence);
}

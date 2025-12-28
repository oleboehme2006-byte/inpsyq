/**
 * SEVERITY COLORS — Strict Severity to Visual Mapping
 * 
 * Defines the GLOBAL, INDEX-AGNOSTIC mapping from severity/impact levels to colors.
 * 
 * RULES:
 * 1. Index color NEVER controls severity color
 * 2. Severity color is global and index-agnostic
 * 3. This mapping is reused by ALL dashboards
 * 4. Color tokens map to CSS custom properties, not actual color values
 */

import {
    DriverSeverityLevel,
    DependencyImpactLevel,
    SeverityColorToken,
    PriorityTier,
} from './types';

// ============================================================================
// Severity → Color Mapping
// ============================================================================

const SEVERITY_COLOR_MAP: Readonly<Record<DriverSeverityLevel, SeverityColorToken>> = {
    C0: 'severity-neutral',
    C1: 'severity-warning-subtle',
    C2: 'severity-warning-strong',
    C3: 'severity-critical',
} as const;

const SEVERITY_PRIORITY_MAP: Readonly<Record<DriverSeverityLevel, PriorityTier>> = {
    C0: 0,
    C1: 1,
    C2: 2,
    C3: 3,
} as const;

// ============================================================================
// Impact → Color Mapping
// ============================================================================

const IMPACT_COLOR_MAP: Readonly<Record<DependencyImpactLevel, SeverityColorToken>> = {
    D1: 'severity-neutral',        // Low impact = no highlight
    D2: 'severity-warning-subtle', // Moderate impact = subtle warning
    D3: 'severity-warning-strong', // High impact = strong warning (not critical)
} as const;

const IMPACT_PRIORITY_MAP: Readonly<Record<DependencyImpactLevel, PriorityTier>> = {
    D1: 0,
    D2: 1,
    D3: 2, // Capped at 2; dependencies don't reach priority 3 (reserved for internal C3)
} as const;

// ============================================================================
// Color Token to CSS Variable Reference
// ============================================================================

/**
 * CSS variable names that must be defined in the application stylesheet.
 * These are the source of truth for actual color values.
 */
export const SEVERITY_CSS_VARIABLES: Readonly<Record<SeverityColorToken, string>> = {
    'severity-neutral': '--color-severity-neutral',
    'severity-warning-subtle': '--color-severity-warning-subtle',
    'severity-warning-strong': '--color-severity-warning-strong',
    'severity-critical': '--color-severity-critical',
} as const;

// ============================================================================
// Exported Helper Functions
// ============================================================================

/**
 * Get the color token for a driver severity level.
 * This is INDEX-AGNOSTIC — all severity levels use the same colors.
 */
export function getSeverityColor(severityLevel: DriverSeverityLevel): SeverityColorToken {
    const color = SEVERITY_COLOR_MAP[severityLevel];
    if (!color) {
        throw new Error(`Unknown severity level: ${severityLevel}`);
    }
    return color;
}

/**
 * Get the priority tier for a driver severity level.
 * Higher priority = more attention needed = rendered first.
 */
export function getPriorityLevel(severityLevel: DriverSeverityLevel): PriorityTier {
    const priority = SEVERITY_PRIORITY_MAP[severityLevel];
    if (priority === undefined) {
        throw new Error(`Unknown severity level: ${severityLevel}`);
    }
    return priority;
}

/**
 * Get the color token for a dependency impact level.
 * Dependencies use the same color palette but max out at warning-strong.
 */
export function getImpactColor(impactLevel: DependencyImpactLevel): SeverityColorToken {
    const color = IMPACT_COLOR_MAP[impactLevel];
    if (!color) {
        throw new Error(`Unknown impact level: ${impactLevel}`);
    }
    return color;
}

/**
 * Get the priority tier for a dependency impact level.
 */
export function getImpactPriorityLevel(impactLevel: DependencyImpactLevel): PriorityTier {
    const priority = IMPACT_PRIORITY_MAP[impactLevel];
    if (priority === undefined) {
        throw new Error(`Unknown impact level: ${impactLevel}`);
    }
    return priority;
}

/**
 * Get the CSS variable name for a severity color token.
 */
export function getCSSVariable(colorToken: SeverityColorToken): string {
    const cssVar = SEVERITY_CSS_VARIABLES[colorToken];
    if (!cssVar) {
        throw new Error(`Unknown color token: ${colorToken}`);
    }
    return cssVar;
}

/**
 * Compare two severity levels. Returns:
 * - Negative if a < b
 * - Zero if a === b
 * - Positive if a > b
 */
export function compareSeverityLevels(
    a: DriverSeverityLevel,
    b: DriverSeverityLevel
): number {
    return SEVERITY_PRIORITY_MAP[a] - SEVERITY_PRIORITY_MAP[b];
}

/**
 * Compare two impact levels. Returns:
 * - Negative if a < b
 * - Zero if a === b
 * - Positive if a > b
 */
export function compareImpactLevels(
    a: DependencyImpactLevel,
    b: DependencyImpactLevel
): number {
    return IMPACT_PRIORITY_MAP[a] - IMPACT_PRIORITY_MAP[b];
}

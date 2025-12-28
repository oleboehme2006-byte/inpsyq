/**
 * INTERPRETATION TYPES — Structured Output Contracts
 * 
 * Defines the canonical shape of weekly interpretation outputs.
 * All sections are required but may be empty per policy.
 */

// ============================================================================
// Severity & Priority Types
// ============================================================================

/** Internal driver severity levels */
export type SeverityLevel = 'C0' | 'C1' | 'C2' | 'C3';

/** External dependency impact levels */
export type ImpactLevel = 'D0' | 'D1' | 'D2' | 'D3';

/** Priority derived from severity/impact */
export type Priority = 'NONE' | 'NORMAL' | 'HIGH' | 'IMMEDIATE';

/** Controllability classification */
export type Controllability = 'FULL' | 'PARTIAL' | 'MINIMAL' | 'NONE';

// ============================================================================
// Driver & Dependency Lines
// ============================================================================

export interface DriverLine {
    label: string;
    severityLevel: SeverityLevel;
    directionalityHint: 'WORSENING' | 'STABLE' | 'IMPROVING';
    evidenceTag: string;
}

export interface DependencyLine {
    label: string;
    impactLevel: ImpactLevel;
    controllability: Controllability;
    evidenceTag: string;
}

// ============================================================================
// Interpretation Sections
// ============================================================================

export interface PrimaryDrivers {
    internal: DriverLine[];  // max 3
    external: DependencyLine[];  // max 3
}

export interface WeeklyInterpretationSections {
    /** Executive summary: 40-90 words */
    executiveSummary: string;

    /** What changed this week: 3-6 bullets, ≤18 words each */
    whatChanged: string[];

    /** Primary drivers with internal/external split */
    primaryDrivers: PrimaryDrivers;

    /** Risk outlook: max 3 items */
    riskOutlook: string[];

    /** Recommended focus: max 5, gated by policy */
    recommendedFocus: string[];

    /** Confidence and limitations: 25-60 words */
    confidenceAndLimits: string;
}

// ============================================================================
// Stored Record
// ============================================================================

export interface WeeklyInterpretationRecord {
    orgId: string;
    teamId: string | null;  // null = org-level
    weekStart: string;
    inputHash: string;
    createdAt: Date;
    modelId: string;
    promptVersion: string;
    sectionsJson: WeeklyInterpretationSections;
    sectionsMd?: string;
    isActive: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const PROMPT_VERSION = 'v1.0.0';

export const MODEL_ID_FALLBACK = 'deterministic-fallback';
export const MODEL_ID_GPT4 = 'gpt-4o-mini';

export const SECTION_LIMITS = {
    executiveSummary: { minWords: 40, maxWords: 90 },
    whatChanged: { minItems: 3, maxItems: 6, maxWordsPerItem: 18 },
    primaryDrivers: { maxInternal: 3, maxExternal: 3 },
    riskOutlook: { maxItems: 3 },
    recommendedFocus: { maxItems: 5 },
    confidenceAndLimits: { minWords: 25, maxWords: 60 },
} as const;

export const MAX_EXPLICIT_NUMBERS = 6;

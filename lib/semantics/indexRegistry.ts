/**
 * INDEX REGISTRY — Canonical Semantic Definitions
 * 
 * This file is the SINGLE SOURCE OF TRUTH for all psychological indices in InPsyq.
 * All dashboards, scoring engines, and interpretation layers MUST reference this registry.
 * 
 * RULES:
 * - No duplicate meanings allowed
 * - Thresholds MUST be strictly ordered
 * - Adjectives must match psychological correctness
 * - This file contains NO UI text, only semantic definitions
 */

// ============================================================================
// Types
// ============================================================================

export type IndexId = 'strain' | 'withdrawal_risk' | 'trust_gap' | 'engagement';

export type Directionality = 'higher_is_worse' | 'higher_is_better';

export type QualitativeState =
    | 'minimal'
    | 'low'
    | 'moderate'
    | 'elevated'
    | 'high'
    | 'severe'
    | 'critical';

export interface IndexThresholds {
    /** Value at or below which index is in "normal" range */
    readonly normal: number;
    /** Value at which risk becomes notable */
    readonly risk: number;
    /** Value at which state becomes critical */
    readonly critical: number;
}

export interface IndexDefinition {
    readonly id: IndexId;
    readonly displayName: string;
    readonly psychologicalMeaning: string;
    readonly directionality: Directionality;
    readonly normalRange: { readonly min: number; readonly max: number };
    readonly riskThreshold: number;
    readonly criticalThreshold: number;
    readonly allowedQualitativeStates: readonly QualitativeState[];
    readonly forbiddenDescriptors: readonly string[];
}

// ============================================================================
// Registry
// ============================================================================

export const INDEX_REGISTRY: Readonly<Record<IndexId, IndexDefinition>> = {
    strain: {
        id: 'strain',
        displayName: 'Strain Index',
        psychologicalMeaning:
            'Accumulated psychological load from demands exceeding recovery capacity. ' +
            'Indicates capacity exhaustion trajectory and burnout risk.',
        directionality: 'higher_is_worse',
        normalRange: { min: 0, max: 0.35 },
        riskThreshold: 0.6,
        criticalThreshold: 0.75,
        allowedQualitativeStates: ['minimal', 'low', 'moderate', 'elevated', 'high', 'severe', 'critical'],
        forbiddenDescriptors: [
            'positive strain',
            'healthy strain',
            'productive strain',
            'optimal strain',
            'good stress', // Strain is never good; eustress is a different construct
        ],
    },

    withdrawal_risk: {
        id: 'withdrawal_risk',
        displayName: 'Withdrawal Risk',
        psychologicalMeaning:
            'Probability of psychological or physical disengagement. ' +
            'Combines signals of active job search, mental checkout, and reduced discretionary effort.',
        directionality: 'higher_is_worse',
        normalRange: { min: 0, max: 0.3 },
        riskThreshold: 0.55,
        criticalThreshold: 0.7,
        allowedQualitativeStates: ['minimal', 'low', 'moderate', 'elevated', 'high', 'severe', 'critical'],
        forbiddenDescriptors: [
            'healthy withdrawal',
            'positive disengagement',
            'strategic withdrawal', // Withdrawal in this context is never strategic
            'good attrition',
        ],
    },

    trust_gap: {
        id: 'trust_gap',
        displayName: 'Trust Gap',
        psychologicalMeaning:
            'Discrepancy between expected and perceived trustworthiness of leadership and peers. ' +
            'Indicates alignment breakdown, communication failures, or broken psychological contracts.',
        directionality: 'higher_is_worse',
        normalRange: { min: 0, max: 0.3 },
        riskThreshold: 0.5,
        criticalThreshold: 0.65,
        allowedQualitativeStates: ['minimal', 'low', 'moderate', 'elevated', 'high', 'severe', 'critical'],
        forbiddenDescriptors: [
            'healthy distrust',
            'productive skepticism', // This is a different construct
            'good gap',
            'positive mistrust',
        ],
    },

    engagement: {
        id: 'engagement',
        displayName: 'Engagement Index',
        psychologicalMeaning:
            'Composite measure of vigor (energy), dedication (involvement), and absorption (focus). ' +
            'Proxy for discretionary effort and intrinsic motivation.',
        directionality: 'higher_is_better',
        normalRange: { min: 0.65, max: 1.0 },
        riskThreshold: 0.4,
        criticalThreshold: 0.25,
        allowedQualitativeStates: ['minimal', 'low', 'moderate', 'elevated', 'high', 'severe', 'critical'],
        forbiddenDescriptors: [
            'excessive engagement', // Overengagement is a different construct (workaholism)
            'dangerous engagement',
            'unhealthy dedication',
            'toxic engagement',
        ],
    },
} as const;

// ============================================================================
// Validation & Assertions
// ============================================================================

/**
 * Validates that all index thresholds are strictly ordered.
 * For higher_is_worse: normal < risk < critical
 * For higher_is_better: critical < risk < normal
 * Throws if validation fails.
 */
export function validateIndexThresholds(): void {
    for (const [id, def] of Object.entries(INDEX_REGISTRY)) {
        if (def.directionality === 'higher_is_worse') {
            // For strain-type indices: normalRange.max < riskThreshold < criticalThreshold
            if (!(def.normalRange.max < def.riskThreshold)) {
                throw new Error(
                    `Index "${id}": normalRange.max (${def.normalRange.max}) must be < riskThreshold (${def.riskThreshold})`
                );
            }
            if (!(def.riskThreshold < def.criticalThreshold)) {
                throw new Error(
                    `Index "${id}": riskThreshold (${def.riskThreshold}) must be < criticalThreshold (${def.criticalThreshold})`
                );
            }
        } else {
            // For engagement-type indices: criticalThreshold < riskThreshold < normalRange.min
            if (!(def.criticalThreshold < def.riskThreshold)) {
                throw new Error(
                    `Index "${id}": criticalThreshold (${def.criticalThreshold}) must be < riskThreshold (${def.riskThreshold})`
                );
            }
            if (!(def.riskThreshold < def.normalRange.min)) {
                throw new Error(
                    `Index "${id}": riskThreshold (${def.riskThreshold}) must be < normalRange.min (${def.normalRange.min})`
                );
            }
        }
    }
}

/**
 * Get index definition by ID. Throws if not found.
 */
export function getIndexDefinition(id: IndexId): IndexDefinition {
    const def = INDEX_REGISTRY[id];
    if (!def) {
        throw new Error(`Index "${id}" not found in registry`);
    }
    return def;
}

/**
 * Get qualitative state for a given index value.
 * Deterministic mapping based on thresholds.
 */
export function getQualitativeStateForIndex(
    indexId: IndexId,
    value: number
): QualitativeState {
    const def = getIndexDefinition(indexId);

    if (def.directionality === 'higher_is_worse') {
        // Strain-type: higher value = worse state
        if (value >= def.criticalThreshold) return 'critical';
        if (value >= def.riskThreshold) return 'high';
        if (value >= (def.riskThreshold + def.normalRange.max) / 2) return 'elevated';
        if (value >= def.normalRange.max) return 'moderate';
        if (value >= def.normalRange.max * 0.5) return 'low';
        return 'minimal';
    } else {
        // Engagement-type: lower value = worse state
        if (value <= def.criticalThreshold) return 'critical';
        if (value <= def.riskThreshold) return 'low';
        if (value <= (def.riskThreshold + def.normalRange.min) / 2) return 'moderate';
        if (value <= def.normalRange.min) return 'elevated'; // Approaching good
        if (value <= (def.normalRange.min + def.normalRange.max) / 2) return 'high';
        return 'minimal'; // Actually represents "no concern" for engagement
    }
}

// ============================================================================
// Type Guards
// ============================================================================

export function isValidIndexId(id: string): id is IndexId {
    return id in INDEX_REGISTRY;
}

// Run validation on module load (fail fast)
validateIndexThresholds();

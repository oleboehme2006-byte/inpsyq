/**
 * Index Semantics Registry
 * 
 * Defines the complete semantic metadata for all psychological indices.
 * This is the single source of truth for:
 * - What each index measures
 * - Business meaning
 * - Directionality (higher = better/worse)
 * - Thresholds for qualitative states
 * - Color encoding rules
 */

// ==========================================
// Types
// ==========================================

export type Directionality = 'higher_is_better' | 'higher_is_worse';

export type QualitativeState =
    | 'excellent'
    | 'good'
    | 'stable'
    | 'elevated'
    | 'concerning'
    | 'critical';

export type ColorTheme =
    | 'strain'
    | 'withdrawal'
    | 'trust-gap'
    | 'engagement'
    | 'meta';

export interface IndexThresholds {
    excellent: number;  // Value at which state is excellent
    good: number;       // Value at which state is good
    concerning: number; // Value at which state becomes concerning
    critical: number;   // Value at which state is critical
}

export interface IndexDefinition {
    id: string;
    label: string;
    shortLabel: string;
    description: string;
    businessMeaning: string;
    directionality: Directionality;
    thresholds: IndexThresholds;
    colorTheme: ColorTheme;
    unit?: string;
}

// ==========================================
// Core Indices
// ==========================================

export const INDEX_DEFINITIONS: Record<string, IndexDefinition> = {
    strain_index: {
        id: 'strain_index',
        label: 'Strain Index',
        shortLabel: 'Strain',
        description: 'Aggregate measure of psychological load and stress accumulation across the team.',
        businessMeaning: 'Indicates capacity exhaustion risk. High strain predicts burnout, errors, and turnover.',
        directionality: 'higher_is_worse',
        thresholds: {
            excellent: 0.2,   // Below 0.2 is excellent
            good: 0.35,       // Below 0.35 is good
            concerning: 0.6,  // Above 0.6 is concerning
            critical: 0.75,   // Above 0.75 is critical
        },
        colorTheme: 'strain',
    },

    withdrawal_risk: {
        id: 'withdrawal_risk',
        label: 'Withdrawal Risk',
        shortLabel: 'Withdrawal',
        description: 'Probability of disengagement or departure based on behavioral and psychological signals.',
        businessMeaning: 'Leading indicator for turnover. High risk suggests active job searching or mental checkout.',
        directionality: 'higher_is_worse',
        thresholds: {
            excellent: 0.15,
            good: 0.3,
            concerning: 0.55,
            critical: 0.7,
        },
        colorTheme: 'withdrawal',
    },

    trust_gap: {
        id: 'trust_gap',
        label: 'Trust Gap',
        shortLabel: 'Trust Gap',
        description: 'Discrepancy between expected and perceived trust in leadership and peers.',
        businessMeaning: 'Measures alignment breakdown. High gap indicates communication failures or broken expectations.',
        directionality: 'higher_is_worse',
        thresholds: {
            excellent: 0.15,
            good: 0.3,
            concerning: 0.5,
            critical: 0.65,
        },
        colorTheme: 'trust-gap',
    },

    engagement_index: {
        id: 'engagement_index',
        label: 'Engagement Index',
        shortLabel: 'Engagement',
        description: 'Composite measure of vigor, dedication, and absorption in work.',
        businessMeaning: 'Proxy for discretionary effort. Higher engagement correlates with performance and retention.',
        directionality: 'higher_is_better',
        thresholds: {
            excellent: 0.8,   // Above 0.8 is excellent
            good: 0.65,       // Above 0.65 is good
            concerning: 0.4,  // Below 0.4 is concerning
            critical: 0.25,   // Below 0.25 is critical
        },
        colorTheme: 'engagement',
    },

    psychological_safety: {
        id: 'psychological_safety',
        label: 'Psychological Safety',
        shortLabel: 'Psych Safety',
        description: 'Belief that the team is safe for interpersonal risk-taking.',
        businessMeaning: 'Prerequisite for innovation and candid feedback. Low safety suppresses voice and learning.',
        directionality: 'higher_is_better',
        thresholds: {
            excellent: 0.8,
            good: 0.65,
            concerning: 0.45,
            critical: 0.3,
        },
        colorTheme: 'engagement',
    },
};

// ==========================================
// Parameter Definitions (Sub-constructs)
// ==========================================

export interface ParameterDefinition {
    id: string;
    label: string;
    description: string;
    parentIndex: string;
    directionality: Directionality;
    weight?: number;  // Contribution weight to parent index
}

export const PARAMETER_DEFINITIONS: Record<string, ParameterDefinition> = {
    // Strain contributors
    emotional_load: {
        id: 'emotional_load',
        label: 'Emotional Load',
        description: 'Accumulated burden of regulating emotions and stress.',
        parentIndex: 'strain_index',
        directionality: 'higher_is_worse',
        weight: 0.25,
    },
    cognitive_dissonance: {
        id: 'cognitive_dissonance',
        label: 'Cognitive Dissonance',
        description: 'Mental discomfort from conflicting beliefs or values.',
        parentIndex: 'strain_index',
        directionality: 'higher_is_worse',
        weight: 0.2,
    },
    workload: {
        id: 'workload',
        label: 'Workload',
        description: 'Balance between job demands and resources.',
        parentIndex: 'strain_index',
        directionality: 'higher_is_worse',
        weight: 0.25,
    },
    autonomy_friction: {
        id: 'autonomy_friction',
        label: 'Autonomy Friction',
        description: 'Constraints on discretion and decision-making.',
        parentIndex: 'strain_index',
        directionality: 'higher_is_worse',
        weight: 0.15,
    },

    // Trust contributors
    trust_leadership: {
        id: 'trust_leadership',
        label: 'Trust in Leadership',
        description: 'Confidence in the integrity and ability of immediate leadership.',
        parentIndex: 'trust_gap',
        directionality: 'higher_is_better',
        weight: 0.5,
    },
    trust_peers: {
        id: 'trust_peers',
        label: 'Trust in Peers',
        description: 'Confidence in reliability and support of colleagues.',
        parentIndex: 'trust_gap',
        directionality: 'higher_is_better',
        weight: 0.5,
    },

    // Engagement contributors
    meaning: {
        id: 'meaning',
        label: 'Meaning',
        description: 'Perception that work is significant and purposeful.',
        parentIndex: 'engagement_index',
        directionality: 'higher_is_better',
        weight: 0.3,
    },
    autonomy: {
        id: 'autonomy',
        label: 'Autonomy',
        description: 'Degree of discretion and control over work.',
        parentIndex: 'engagement_index',
        directionality: 'higher_is_better',
        weight: 0.25,
    },
    control: {
        id: 'control',
        label: 'Perceived Control',
        description: 'Sense of agency over work outcomes.',
        parentIndex: 'engagement_index',
        directionality: 'higher_is_better',
        weight: 0.2,
    },
    adaptive_capacity: {
        id: 'adaptive_capacity',
        label: 'Adaptive Capacity',
        description: 'Ability to handle and adjust to change.',
        parentIndex: 'engagement_index',
        directionality: 'higher_is_better',
        weight: 0.15,
    },
};

// ==========================================
// Semantic Interpretation Functions
// ==========================================

/**
 * Get qualitative state from numeric value based on index definition
 */
export function getQualitativeState(
    indexId: string,
    value: number
): QualitativeState {
    const def = INDEX_DEFINITIONS[indexId];
    if (!def) return 'stable';

    const { thresholds, directionality } = def;

    if (directionality === 'higher_is_worse') {
        if (value >= thresholds.critical) return 'critical';
        if (value >= thresholds.concerning) return 'concerning';
        if (value <= thresholds.excellent) return 'excellent';
        if (value <= thresholds.good) return 'good';
        return 'stable';
    } else {
        // higher_is_better
        if (value >= thresholds.excellent) return 'excellent';
        if (value >= thresholds.good) return 'good';
        if (value <= thresholds.critical) return 'critical';
        if (value <= thresholds.concerning) return 'concerning';
        return 'stable';
    }
}

/**
 * Get display color CSS class based on index and value
 */
export function getValueColorClass(indexId: string, value: number): string {
    const state = getQualitativeState(indexId, value);
    const def = INDEX_DEFINITIONS[indexId];

    switch (state) {
        case 'critical':
            return def?.directionality === 'higher_is_worse'
                ? 'text-strain-high'
                : 'text-strain';
        case 'concerning':
            return def?.directionality === 'higher_is_worse'
                ? 'text-strain'
                : 'text-withdrawal';
        case 'excellent':
            return 'text-engagement-high';
        case 'good':
            return 'text-engagement';
        default:
            return 'text-text-secondary';
    }
}

/**
 * Get qualitative adjective for hover/tooltip display
 */
export function getQualitativeAdjective(
    indexId: string,
    value: number
): string {
    const state = getQualitativeState(indexId, value);
    const def = INDEX_DEFINITIONS[indexId];

    if (!def) return 'stable';

    // Customize adjectives based on the specific index
    const adjectives: Record<string, Record<QualitativeState, string>> = {
        strain_index: {
            excellent: 'minimal',
            good: 'low',
            stable: 'moderate',
            elevated: 'elevated',
            concerning: 'high',
            critical: 'severe',
        },
        withdrawal_risk: {
            excellent: 'very low',
            good: 'low',
            stable: 'moderate',
            elevated: 'elevated',
            concerning: 'high',
            critical: 'acute',
        },
        trust_gap: {
            excellent: 'aligned',
            good: 'minimal',
            stable: 'moderate',
            elevated: 'growing',
            concerning: 'significant',
            critical: 'severe',
        },
        engagement_index: {
            excellent: 'thriving',
            good: 'strong',
            stable: 'stable',
            elevated: 'declining',
            concerning: 'weak',
            critical: 'disengaged',
        },
        psychological_safety: {
            excellent: 'strong',
            good: 'healthy',
            stable: 'adequate',
            elevated: 'fragile',
            concerning: 'compromised',
            critical: 'absent',
        },
    };

    return adjectives[indexId]?.[state] || state;
}

/**
 * Determine if trend direction is good or bad based on index directionality
 */
export function isTrendPositive(
    indexId: string,
    trendDirection: 'IMPROVING' | 'STABLE' | 'DETERIORATING'
): boolean | null {
    const def = INDEX_DEFINITIONS[indexId];
    if (!def || trendDirection === 'STABLE') return null;

    if (def.directionality === 'higher_is_worse') {
        // For strain etc., "improving" means going down
        return trendDirection === 'DETERIORATING'; // Actually decreasing
    } else {
        return trendDirection === 'IMPROVING';
    }
}

/**
 * Get CSS class for trend indicator based on whether change is good
 */
export function getTrendClass(indexId: string, velocity: number): string {
    const def = INDEX_DEFINITIONS[indexId];
    if (!def || Math.abs(velocity) < 0.01) return 'trend-stable';

    const isIncreasing = velocity > 0;
    const isGoodTrend = def.directionality === 'higher_is_better'
        ? isIncreasing
        : !isIncreasing;

    return isGoodTrend ? 'trend-up' : 'trend-down';
}

/**
 * Get color with uncertainty factored in
 * Higher uncertainty = more desaturated
 */
export function getUncertaintyAdjustedOpacity(uncertainty: number): number {
    // uncertainty 0 = full opacity, uncertainty 1 = 0.4 opacity
    return Math.max(0.4, 1 - (uncertainty * 0.6));
}


import { InfluenceScope } from './types';


// ==========================================
// 1. Metric Thresholds & Weights
// ==========================================

// Normalized scores (0-1). 
// Note: Some metrics are "Higher is Better" (WRP, OUC), others "Lower is Better" (TFP, Strain).
// We will normalize ALL to "Higher is Better" (Health Score) internally before classification.

export const THRESHOLDS = {
    CRITICAL_HEALTH: 0.4, // Below 0.4 is CRITICAL
    RISK_HEALTH: 0.7,     // Below 0.7 is AT_RISK
    // Above 0.7 is HEALTHY
};

// ==========================================
// 2. Parameter Influence Mapping
// ==========================================

export const PARAM_INFLUENCE: Record<string, InfluenceScope> = {
    // Structural / Systemic (Hard to change directly, requires re-org or process change)
    'emotional_load': 'SYSTEMIC',
    'cognitive_load': 'SYSTEMIC',
    'role_ambiguity': 'ORGANIZATION',

    // Leadership / Management
    'control': 'LEADERSHIP',
    'autonomy_friction': 'LEADERSHIP',
    'trust_leadership': 'LEADERSHIP',
    'psych_safety': 'LEADERSHIP', // Often set by leader tone

    // Team Dynamics
    'social_cohesion': 'TEAM',
    'trust_peers': 'TEAM',
    'trust_gap': 'TEAM', // Derived

    // Individual / Intrinsic
    'meaning': 'INDIVIDUAL',
    'engagement': 'INDIVIDUAL',
    'cognitive_dissonance': 'INDIVIDUAL',
    'adaptive_capacity': 'INDIVIDUAL'
};

export const IS_ACTIONABLE: Record<string, boolean> = {
    'emotional_load': false, // Often inherent to job
    'cognitive_load': false,
    'role_ambiguity': true, // Leadership can clarify
    'control': true,        // Leadership can delegate
    'autonomy_friction': true,
    'trust_leadership': true, // Adapt behavior
    'psych_safety': true,
    'social_cohesion': true, // Team building
    'trust_peers': true,
    'meaning': false, // Hard to force
    'engagement': false, // Output, not input
    'cognitive_dissonance': false,
    'adaptive_capacity': false
};

// ==========================================
// 3. Action Templates
// ==========================================

export const ACTION_TEMPLATES: Record<string, any> = {
    'INTERVENTION_AUTONOMY': {
        title: 'Autonomy & Control Audit',
        description: 'Team reports high friction in decision making. Review approval chains and delegation boundaries.'
    },
    'INTERVENTION_SAFETY': {
        title: 'Psychological Safety Reset',
        description: 'Low safety detected. Institute blame-free retrospectives and active listening sessions immediately.'
    },
    'INTERVENTION_LOAD': {
        title: 'Workload Rebalancing',
        description: 'Critical strain due to emotional/cognitive load. Audit current sprint capacity and pause non-essential initiatives.'
    },
    'INTERVENTION_ALIGNMENT': {
        title: 'Strategic Alignment Workshop',
        description: 'High cognitive dissonance or role ambiguity. Clarify mission, OKRs, and individual contributions.'
    },
    'INTERVENTION_TRUST': {
        title: 'Trust Building Initiative',
        description: 'Significant trust gap detected. Facilitate transparent leadership AMA (Ask Me Anything) and peer bonding.'
    },
    'MAINTAIN_COURSE': {
        title: 'Monitor & Sustain',
        description: 'Metrics are healthy. Specific intervention not required. Continue regular 1:1s.'
    }
};

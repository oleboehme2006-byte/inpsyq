import { Parameter } from '@/lib/constants';

// 1. Constructs Union (Psychometrically Valid)
export const CONSTRUCTS = [
    'psychological_safety',
    'trust',
    'autonomy',
    'meaning',
    'fairness',
    'workload',
    'role_clarity',
    'social_support',
    'learning_climate',
    'leadership_quality',
    'adaptive_capacity', // mixed construct
    'engagement'
] as const;

export type Construct = typeof CONSTRUCTS[number];

export const RESPONSE_MODES = ['slider', 'rating', 'choice', 'text', 'dialog', 'scenario', 'frequency'] as const;
export type ResponseMode = typeof RESPONSE_MODES[number];

// 2. Evidence Atomic Record
export interface Evidence {
    construct: Construct;
    direction: 1 | -1; // Positive or Negative signal
    strength: number; // 0.0 to 1.0 (magnitude)
    confidence: number; // 0.0 to 1.0 (certainty of coding)
    evidence_type: 'affect' | 'cognition' | 'behavior_intent' | 'social' | 'self_report';
    time_horizon?: 'today' | 'week' | 'month';
    scope?: 'self' | 'team' | 'lead' | 'org';
    explanation_short: string;
}

// 3. Item Specification
export interface ItemSpec {
    item_id?: string; // Optional (generated if new)
    construct_primary: Construct;
    construct_secondary?: Construct[];
    polarity: 'direct' | 'reverse';
    response_mode: ResponseMode;
    prompt_text: string;

    // Response Options / Anchors
    response_options?: {
        label: string;
        value_code?: string; // For analytics
        coding: Evidence[]; // Deterministic mapping for this option
    }[];

    // Sliders
    anchors?: {
        min: string;
        max: string;
    };

    required?: boolean;
}

// 4. LLM Coding Result (Output from Interpreter)
export interface CodingResult {
    evidence: Evidence[];
    flags?: {
        off_topic?: boolean;
        ambiguous?: boolean;
        sensitive?: boolean;
    };
}

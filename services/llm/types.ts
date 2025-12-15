import { Parameter } from '@/lib/constants';

export type InteractionType = 'slider' | 'rating' | 'choice' | 'text' | 'dialog';

// Structured Output Schema for Generator
export interface GeneratedInteraction {
    type: InteractionType;
    prompt_text: string;
    targets: Parameter[];
    response_spec?: {
        min_label?: string;
        max_label?: string;
        choices?: string[]; // For 'choice' type
        guidance?: string;
    };
    psych_rationale: string;
}

export interface SessionPlan {
    interactions: GeneratedInteraction[];
}

// Structured Output Schema for Interpreter
export interface InterpretedSignal {
    parameter: Parameter;
    value: number; // 0..1
    confidence: number; // 0..1
    evidence_snippet?: string;
}

export interface InterpretationResult {
    signals: InterpretedSignal[];
    notes?: {
        ambiguity: 'low' | 'medium' | 'high';
        safety_flags: string[];
    };
}

// Briefing Types
export interface BriefOutput {
    headline: string;
    state_summary: string;
    trend_summary: string;
    top_drivers: {
        name: string;
        scope: string;
        why_it_matters: string;
        evidence_from_data: string;
    }[];
    influence_actions: {
        scope: string;
        action_title: string;
        steps: string[];
    }[];
    risks_and_watchouts: string[];
    confidence_statement: string;
    citations: {
        source: string;
        fields_used: string[];
    }[];
}

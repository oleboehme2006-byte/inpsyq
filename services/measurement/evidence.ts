
import { Construct } from './constructs';

export type ResponseMode = 'slider' | 'choice' | 'text' | 'rating' | 'scenario';

export interface Evidence {
    construct: Construct;
    direction: 1 | -1;          // Positive or Negative contribution
    strength: number;           // 0.0 to 1.0 (magnitude of the signal)
    confidence: number;         // 0.0 to 1.0 (certainty of the observation)
    evidence_type: 'affect' | 'cognition' | 'behavior_intent' | 'social' | 'self_report';
    explanation_short: string;  // < 240 chars, no PII
    source_id?: string;         // optional reference to item_id
}

export interface ChoiceOption {
    label: string;
    description?: string;
    coding: Evidence[];
    code: string; // Stable identifier for the option
}

export interface ItemSpec {
    id?: string;
    prompt_text: string;
    construct: Construct;
    response_mode: ResponseMode;

    // For Choice
    options?: ChoiceOption[];

    // For Slider
    min_label?: string;
    max_label?: string;

    // Meta
    required: boolean;
    coverage_target?: Construct;
}

export interface CodingResult {
    evidence: Evidence[];
    flags: {
        off_topic: boolean;
        ambiguous: boolean;
        sensitive: boolean;
    };
}

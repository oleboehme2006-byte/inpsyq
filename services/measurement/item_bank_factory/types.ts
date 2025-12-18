
import { Construct } from '../constructs';

// --- Core Enums & Types ---

export type ResponseType = 'rating' | 'choice' | 'text';
export type TimeWindow = '7d' | '14d' | '30d';
export type Difficulty = 'shallow' | 'medium' | 'deep';
export type SourceType = 'template' | 'llm_paraphrase' | 'curated';

// New Epistemic Types
export type MeasurementIntent = "explore" | "confirm" | "challenge" | "stabilize";
export type MeasurementTone = "diagnostic" | "reflective" | "behavioral";
export type TemporalSensitivity = "low" | "medium" | "high";

export interface EpistemicRequirements {
    min_sigma?: number;
    max_sigma?: number;
    min_observations?: number;
    disallowed_states?: string[]; // "ignorant" | "exploratory" etc.
}

export interface Evidence {
    construct: Construct;
    direction: 1 | -1;
    strength: number; // 0.1 to 1.0
    confidence: number; // 0.1 to 1.0
}

export interface RatingSpec {
    scale_min: number;
    scale_max: number;
    min_label: string;
    max_label: string;
}

export interface ChoiceSpec {
    choices: string[];
    option_codes: Record<string, Evidence[]>;
}

export interface TextSpec {
    interpretation_hint?: string;
}

// --- Canonical Item Schema ---

export interface Item {
    item_id: string; // Deterministic Hash
    construct: Construct;
    type: ResponseType;
    prompt: string;
    guidance?: string;
    time_window: TimeWindow;

    // Response Specs (One must be present matching type)
    rating_spec?: RatingSpec;
    choice_spec?: ChoiceSpec;
    text_spec?: TextSpec;

    parameter_targets?: string[]; // Legacy compatibility if needed
    quality_tags?: string[];
    difficulty: Difficulty;

    version: number;
    source: SourceType;
    created_at: string;
    locale: 'en';

    // Epistemic Metadata
    intent: MeasurementIntent;
    tone: MeasurementTone;
    temporal_sensitivity: TemporalSensitivity;
    epistemic_requirements?: EpistemicRequirements;
}

// --- Validator Types ---

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

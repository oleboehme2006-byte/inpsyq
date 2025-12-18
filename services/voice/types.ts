
import { Construct } from '../measurement/constructs';
import { Item, MeasurementIntent } from '../measurement/item_bank_factory/types';

// --- Core Definitions ---

export type ToneClass = 'diagnostic' | 'reflective' | 'behavioral';

export interface FramingRule {
    id: string;
    pattern: RegExp;
    replacement: string | ((match: string) => string);
    description: string;
    category: 'power_neutralization' | 'tone_normalization' | 'safety';
}

export interface RewriteResult {
    original_text: string;
    rewritten_text: string;
    was_modified: boolean;
    applied_rules: string[]; // IDs of rules applied
    tone_used: ToneClass;
}

export interface VoiceContext {
    construct: Construct;
    intent: MeasurementIntent;
    epistemic_state?: 'ignorant' | 'exploratory' | 'confirmatory' | 'stable';
}

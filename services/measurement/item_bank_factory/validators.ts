
import { Item, ValidationResult } from './types';

const PROMPT_MAX_LENGTH = 220; // Expanded slightly
const DOUBLE_BARREL_REGEX = /\b(and|or)\b.{3,}\?$/i; // Heuristic
const LEADING_PHRASES = ["clearly", "obviously", "don't you think", "everyone knows"];

export function validateItem(item: Item): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Structure
    if (!item.item_id) errors.push("Missing item_id");
    if (!item.construct) errors.push("Missing construct");
    if (!item.prompt) errors.push("Missing prompt");

    // 2. Type Specifics & Metadata
    if (!item.intent) errors.push("Missing 'intent' metadata");
    if (!item.tone) errors.push("Missing 'tone' metadata");
    if (!item.temporal_sensitivity) errors.push("Missing 'temporal_sensitivity' metadata");

    if (item.type === 'rating') {
        if (!item.rating_spec) errors.push("Rating item missing rating_spec");
    } else if (item.type === 'choice') {
        if (!item.choice_spec) errors.push("Choice item missing choice_spec");
        // Verify codes
        if (item.choice_spec) {
            const missingCodes = item.choice_spec.choices.filter(c => !item.choice_spec!.option_codes[c]);
            if (missingCodes.length > 0) {
                // For now, allow empty codes if mapping is TODO, but warn
                // Actually requirement says "Violations must throw runtime error" if bad. 
                // For build, we reject.
                errors.push(`Choice item missing option_codes mapping: ${missingCodes.join(', ')}`);
            }
        }
    }

    // 3. Prompt Quality
    if (item.prompt.length > PROMPT_MAX_LENGTH) {
        errors.push(`Prompt too long (>${PROMPT_MAX_LENGTH} chars)`);
    }

    // Double Barreled?
    // Very simple check: "and" near end of sentence?
    // if (DOUBLE_BARREL_REGEX.test(item.prompt)) {
    //    warnings.push("Possible double-barreled question (detected 'and/or')");
    // }

    // Leading Language
    for (const phrase of LEADING_PHRASES) {
        if (item.prompt.toLowerCase().includes(phrase)) {
            errors.push(`Leading language detected: "${phrase}"`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

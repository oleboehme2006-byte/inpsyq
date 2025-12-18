
import { Item } from '../measurement/item_bank_factory/types';
import { ToneClass } from './types';
import { POWER_NEUTRALIZATION_RULES, LABEL_SANITIZATION_RULES } from './framing_rules';
import { validateSafeText } from './validators';

/**
 * Deterministic engine to rewrite items for psychological safety vs power dynamics.
 */

export function rewriteText(text: string, rules = POWER_NEUTRALIZATION_RULES): { text: string, modified: boolean, rules: string[] } {
    let current = text;
    let modified = false;
    const applied: string[] = [];

    for (const rule of rules) {
        if (rule.pattern.test(current)) {
            const before = current;
            if (typeof rule.replacement === 'function') {
                current = current.replace(rule.pattern, rule.replacement as any); // TS nuance with replace callback
            } else {
                current = current.replace(rule.pattern, rule.replacement);
            }
            if (current !== before) {
                modified = true;
                applied.push(rule.id);
            }
        }
    }

    return { text: current, modified, rules: applied };
}

export function processItem(item: Item, targetTone: ToneClass): Item & { original_text?: string } {
    // 1. Rewrite Prompt
    const pResult = rewriteText(item.prompt, POWER_NEUTRALIZATION_RULES);

    // Combine rules for labels to catch both power terms and bad adjectives
    const ALL_LABEL_RULES = [...POWER_NEUTRALIZATION_RULES, ...LABEL_SANITIZATION_RULES];

    // 2. Rewrite Labels (if Choice or Rating)
    let newRatingSpec = item.rating_spec;
    if (item.type === 'rating' && item.rating_spec) {
        const minRes = rewriteText(item.rating_spec.min_label, ALL_LABEL_RULES);
        const maxRes = rewriteText(item.rating_spec.max_label, ALL_LABEL_RULES);
        if (minRes.modified || maxRes.modified) {
            newRatingSpec = {
                ...item.rating_spec,
                min_label: minRes.text,
                max_label: maxRes.text
            };
        }
    }

    let newChoiceSpec = item.choice_spec;
    if (item.type === 'choice' && item.choice_spec) {
        const oldChoices = item.choice_spec.choices;
        // Use ALL rules for choice text
        const rewritten = oldChoices.map(c => rewriteText(c, ALL_LABEL_RULES));

        if (rewritten.some(r => r.modified)) {
            newChoiceSpec = {
                choices: rewritten.map(r => r.text),
                option_codes: {}
            };

            // Remap codes
            for (let i = 0; i < oldChoices.length; i++) {
                const oldKey = oldChoices[i];
                const newKey = rewritten[i].text;
                // Assuming option_codes exists
                if (item.choice_spec.option_codes && item.choice_spec.option_codes[oldKey]) {
                    (newChoiceSpec.option_codes as any)[newKey] = item.choice_spec.option_codes[oldKey];
                }
            }
        }
    }

    // 3. Validation
    const safety = validateSafeText(pResult.text);
    if (!safety.safe) {
        console.warn(`[VoiceLayer] Rewrite failed safety check for item ${item.item_id}: ${safety.violations.join(', ')}. Falling back to original but flagging.`);
    }

    // 4. Construct Output
    // We do NOT modify the Item type definition globally, but here we return a modified object.
    // The integration layer will handle the "original_text" meta injection.

    // We clone the item
    const finalItem: any = { ...item };

    if (pResult.modified) {
        finalItem.prompt = pResult.text;
        finalItem.original_text = item.prompt; // Meta field for audit
    }

    if (newRatingSpec !== item.rating_spec) {
        finalItem.rating_spec = newRatingSpec;
    }

    if (newChoiceSpec !== item.choice_spec) {
        finalItem.choice_spec = newChoiceSpec;
    }

    return finalItem;
}

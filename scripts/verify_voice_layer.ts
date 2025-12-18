
import { voiceService } from '../services/voice/voiceService';
import { Item } from '../services/measurement/item_bank_factory/types';
import { POWER_NEUTRALIZATION_RULES, LABEL_SANITIZATION_RULES } from '../services/voice/framing_rules';

const MOCK_ITEM: Item = {
    item_id: 'test_1',
    construct: 'autonomy' as any,
    type: 'rating',
    prompt: "How often does your manager evaluate your work?",
    intent: 'confirm',
    tone: 'behavioral',
    temporal_sensitivity: 'medium',
    difficulty: 'medium',
    time_window: '7d',
    source: 'curated',
    version: 1,
    created_at: new Date().toISOString(),
    locale: 'en',
    rating_spec: { scale_min: 1, scale_max: 5, min_label: 'Very bad', max_label: 'Excellent' }
};

const MOCK_CHOICE_ITEM: Item = {
    item_id: 'test_2',
    construct: 'fairness' as any,
    type: 'choice',
    prompt: "Does leadership explain decisions?",
    intent: 'explore',
    tone: 'diagnostic',
    temporal_sensitivity: 'medium',
    difficulty: 'medium',
    time_window: '30d',
    source: 'curated',
    version: 1,
    created_at: new Date().toISOString(),
    locale: 'en',
    choice_spec: {
        choices: ["Yes, leadership is clear", "No, my manager hides it"],
        option_codes: {
            "Yes, leadership is clear": [],
            "No, my manager hides it": []
        }
    }
};

async function runTests() {
    console.log("--- Verifying Voice & Framing Layer ---");

    // Test 1: Power Neutralization (Prompt)
    console.log("\nTest 1: Power Neutralization");
    const res1 = voiceService.applyVoiceLayer({ ...MOCK_ITEM });
    console.log(`Original: "${MOCK_ITEM.prompt}"`);
    console.log(`Rewritten: "${res1.prompt}"`);

    if (res1.prompt !== MOCK_ITEM.prompt && !res1.prompt.includes('manager')) {
        console.log("PASS: Removed 'manager'.");
    } else {
        console.error("FAIL: 'manager' still present or no change.");
    }

    if (res1.original_text === MOCK_ITEM.prompt) {
        console.log("PASS: Preserved original text in metadata.");
    } else {
        console.error("FAIL: Metadata missing.");
    }

    // Test 2: Label Sanitization
    console.log("\nTest 2: Label Sanitization");
    console.log(`Original labels: ${MOCK_ITEM.rating_spec!.min_label} / ${MOCK_ITEM.rating_spec!.max_label}`);
    console.log(`Rewritten labels: ${res1.rating_spec!.min_label} / ${res1.rating_spec!.max_label}`);

    if (res1.rating_spec!.min_label === 'Not Aligned' && res1.rating_spec!.max_label === 'Strongly Aligned') {
        console.log("PASS: Labels sanitized.");
    } else {
        console.error("FAIL: Labels not sanitized correctly.");
    }

    // Test 3: Choice & Option Code Remapping
    console.log("\nTest 3: Choice Remapping");
    const res2 = voiceService.applyVoiceLayer({ ...MOCK_CHOICE_ITEM });
    console.log(`Original choices: ${MOCK_CHOICE_ITEM.choice_spec!.choices.join(' | ')}`);
    console.log(`Rewritten choices: ${res2.choice_spec!.choices.join(' | ')}`);

    const hasManager = res2.choice_spec!.choices.some(c => c.toLowerCase().includes('manager'));
    if (!hasManager) {
        console.log("PASS: Removed 'manager' from choices.");
    } else {
        console.error("FAIL: 'manager' found in choices.");
    }

    // Check Option Codes
    const oldKeys = Object.keys(MOCK_CHOICE_ITEM.choice_spec!.option_codes!);
    const newKeys = Object.keys(res2.choice_spec!.option_codes!);
    console.log(`New Keys: ${newKeys.join(' | ')}`);

    if (newKeys.length === oldKeys.length && !newKeys.includes("No, my manager hides it")) {
        console.log("PASS: Option codes remapped.");
    } else {
        console.error("FAIL: Option codes mismatch.");
    }

    console.log("\n--- Verification Complete ---");
}

runTests().catch(console.error);

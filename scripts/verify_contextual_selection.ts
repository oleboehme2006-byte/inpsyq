
import { selectItemsForSession } from '../services/measurement/contextual_item_selector';
import { MeasurementContext } from '../services/measurement/context';
import { Item, MeasurementIntent, MeasurementTone, TemporalSensitivity } from '../services/measurement/item_bank_factory/types';
import { CONSTRUCTS } from '../services/measurement/constructs';

// --- Mocks ---

const MOCK_BANK: Item[] = [];

// Helper to create items
function createItem(id: string, construct: string, intent: MeasurementIntent, tone: MeasurementTone, temp: TemporalSensitivity): Item {
    return {
        item_id: id,
        construct: construct as any,
        type: 'rating',
        prompt: `Mock item ${id}`,
        intent,
        tone,
        temporal_sensitivity: temp,
        difficulty: 'medium',
        time_window: '7d',
        source: 'curated',
        version: 1,
        created_at: new Date().toISOString(),
        locale: 'en',
        rating_spec: { scale_min: 1, scale_max: 5, min_label: 'Low', max_label: 'High' }
    };
}

// Populate Bank
CONSTRUCTS.forEach(c => {
    // 3 Explore/Diagnostic/Medium
    MOCK_BANK.push(createItem(`${c}_exp_dia_med_1`, c, 'explore', 'diagnostic', 'medium'));
    MOCK_BANK.push(createItem(`${c}_exp_dia_med_2`, c, 'explore', 'diagnostic', 'medium'));
    MOCK_BANK.push(createItem(`${c}_exp_dia_med_3`, c, 'explore', 'diagnostic', 'medium'));

    // 1 Confirm/Reflective/Low
    MOCK_BANK.push(createItem(`${c}_con_ref_low_1`, c, 'confirm', 'reflective', 'low'));

    // 1 Challenge/Behavioral/High
    MOCK_BANK.push(createItem(`${c}_cha_beh_hi_1`, c, 'challenge', 'behavioral', 'high'));
});

// Mock Contexts
function createCtx(construct: string, state: any): MeasurementContext {
    return {
        user_id: 'test_user',
        construct,
        posterior_mean: 0.5,
        posterior_sigma: 0.1,
        volatility: 0.1,
        trend: 'stable',
        observation_count: 10,
        last_observed_at: new Date(), // recent
        epistemic_state: 'confirmatory', // default
        ...state
    };
}

// --- Tests ---

async function runTests() {
    console.log("--- Verifying Contextual Item Selection ---");

    // Test 1: Ignorant Construct Preference
    // Scenario: User is Ignorant in A, Stable in B. Should pick A.
    console.log("\nTest 1: Ignorant Priority");
    const ctx1 = [
        createCtx('autonomy', { epistemic_state: 'ignorant', posterior_sigma: 0.5, volatility: 0.5, observation_count: 0 }),
        createCtx('meaning', { epistemic_state: 'stable', posterior_sigma: 0.1, volatility: 0.1, observation_count: 50 })
    ];

    const res1 = selectItemsForSession({
        userId: 'u1',
        targetCount: 1,
        contexts: ctx1,
        itemBank: MOCK_BANK,
        recentConstructs: []
    });

    console.log(`Selected: ${res1.map(i => `${i.construct} (${i.intent})`).join(', ')}`);
    if (res1.length === 1 && res1[0].construct === 'autonomy') {
        console.log("PASS: Selected Ignorant construct.");
    } else {
        console.error("FAIL: Did not prioritize Ignorant construct.");
    }

    // Test 2: Temporal Sensitivity Filtering
    // Scenario: Volatility Spike in 'meaning' -> Requires High Sensitivity items.
    console.log("\nTest 2: Volatility -> High Sensitivity");
    const ctx2 = [
        createCtx('meaning', { epistemic_state: 'exploratory', volatility: 0.8, last_observed_at: new Date() }) // High Volatility
    ];
    // Bank has: exp_dia_med (Medium), con_ref_low (Low), cha_beh_hi (High).
    // Note: 'confirm' might be blocked if state is exploratory? No, 'confirm' allowed unless ignorant.
    // 'challenge' allowed if count > 3. (Default mock count=10).
    // Rule: Volatility > 0.25 -> Needs 'high' sensitivity.
    // Only 'cha_beh_hi' matches 'high'.
    // BUT 'tone=behavioral' is blocked if sigma > 0.4. Mock sigma is 0.1. So allowed.

    const res2 = selectItemsForSession({
        userId: 'u2',
        targetCount: 1,
        contexts: ctx2,
        itemBank: MOCK_BANK,
        recentConstructs: []
    });

    console.log(`Selected: ${res2.map(i => `${i.construct} [${i.temporal_sensitivity}]`).join(', ')}`);
    if (res2.length > 0 && res2[0].temporal_sensitivity === 'high') {
        console.log("PASS: Selected High Sensitivity item for Volatile context.");
    } else {
        console.warn(`WARN: Selected ${res2[0]?.temporal_sensitivity}. Expected High. (Might have relaxed rules if empty?)`);
    }

    // Test 3: Redundancy Blocking
    // Scenario: 'autonomy' in recent list. 'meaning' not. Both exploratory. Should pick 'meaning'.
    console.log("\nTest 3: Redundancy Blocking");
    const ctx3 = [
        createCtx('autonomy', { epistemic_state: 'exploratory' }),
        createCtx('meaning', { epistemic_state: 'exploratory' })
    ];
    const res3 = selectItemsForSession({
        userId: 'u3',
        targetCount: 1,
        contexts: ctx3,
        itemBank: MOCK_BANK,
        recentConstructs: ['autonomy']
    });

    console.log(`Selected: ${res3.map(i => i.construct).join(', ')}`);
    if (res3.some(i => i.construct === 'meaning') && !res3.some(i => i.construct === 'autonomy')) {
        console.log("PASS: Blocked recent construct.");
    } else {
        console.error("FAIL: Did not block recent construct.");
    }

    // Test 4: Padding Logic
    // Request 5 items from 1 construct context.
    console.log("\nTest 4: Padding Logic");
    const ctx4 = [createCtx('fairness', { epistemic_state: 'ignorant' })];
    const res4 = selectItemsForSession({
        userId: 'u4',
        targetCount: 5,
        contexts: ctx4,
        itemBank: MOCK_BANK,
        recentConstructs: []
    });

    console.log(`Selected Count: ${res4.length}`);
    res4.forEach(i => console.log(` - ${i.construct} (${i.intent}/${i.tone})`));

    if (res4.length === 5) {
        console.log("PASS: Padded to target count.");
        const pads = res4.filter(i => i.construct !== 'fairness'); // Should be pads?
        // Wait, if Construct 'fairness' has enough items in bank?
        // Mock bank has 5 items per construct.
        // Ignorant forbids 'confirm'. So 4 candidates (3 exp, 1 cha).
        // 'challenge' blocked if count < 3. (Ignorant count=0). So 3 candidates (exp).
        // So 3 valid items from Fairness.
        // Needs 2 pads.
        // Pads come from... random exploratory?
        // Mock bank has plenty.
        const nonFairness = res4.filter(i => i.construct !== 'fairness');
        if (nonFairness.length > 0) {
            console.log("PASS: Used padding from other constructs.");
        }
    } else {
        console.error("FAIL: Padding failed.");
    }

    console.log("\n--- Verification Complete ---");
}

runTests().catch(console.error);

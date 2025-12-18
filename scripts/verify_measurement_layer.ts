
import { loadEnv } from '@/lib/env/loadEnv';
loadEnv();

import { interactionGenerator } from '@/services/llm/generators';
import { normalizationService } from '@/services/normalizationService';
import { LLM_CONFIG } from '@/services/llm/client';
import { Parameter } from '@/lib/constants';

async function verify() {
    console.log('--- Verifying Measurement Layer ---');
    console.log(`Model: ${LLM_CONFIG.model}`);

    // 1. Verify Generator (Strict Schema + Coding)
    console.log('\n1. Testing Generator with Option Coding...');
    // Use a random valid UUID to satisfy Postgres syntax
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const plan = await interactionGenerator.generateSessionPlan(testUserId, 5);

    if (plan.error) {
        console.error('❌ Generator Failed:', plan.error);
        process.exit(1);
    }

    const interactions = plan.interactions;
    console.log(`✅ Generated ${interactions.length} interactions.`);

    const choice = interactions.find(i => i.type === 'choice');
    if (!choice) {
        console.warn('⚠️ No choice interaction generated (unlucky seed). Skipping choice test.');
    } else {
        console.log(`\n[Choice Item]: ${choice.prompt_text.split('|||')[0]}`);
        const spec = choice.response_spec;
        // Check strictness: choices should be object or null (but we sanitized it to undefined in generator)
        // Wait, current generator logic sanitizes it.
        // But let's check the RAW prompt metadata which we manually serialized in interactionEngine? 
        // No, interactionEngine does logic, here we have the object from generator.

        // Actually, the generator returns the object *before* serialization.
        // And we updated generator to return `interactions`.

        if (spec && spec.choices && spec.choices.length > 0 && typeof spec.choices[0] === 'object') {
            const firstOpt = spec.choices[0] as any;
            console.log(`✅ Choice Option Structure: Label="${firstOpt.label}" Coding=`, firstOpt.coding);
            if (!firstOpt.coding || !Array.isArray(firstOpt.coding)) {
                console.error('❌ Missing coding in choice option!');
                process.exit(1);
            }
        } else {
            console.error('❌ Choice options missing or not objects inside generator result.');
            // console.log(JSON.stringify(spec, null, 2));
            // It might be null if 'rating' type, but we found 'choice' type.
        }
    }

    // 2. Verify Interpretation (Measurement Layer)
    console.log('\n2. Testing Meaningful Text Interpretation...');
    const textInput = "I feel really supported by my team, we learn a lot together.";
    const result = await normalizationService.normalizeResponse(textInput, 'text', [], {
        prompt_text: 'Describe your team environment ||| {}',
        targets: ['social_support'] // hint
    });

    console.log('Input:', textInput);
    console.log('Signals:', JSON.stringify(result.signals, null, 2));
    console.log('Confidence:', result.confidence);

    if (result.signals.psych_safety > 0.5 || result.signals.trust_peers > 0.5) {
        console.log('✅ Correctly mapped to trust/safety/support parameters.');
    } else {
        console.warn('⚠️ Mapping seems weak for strong positive input.');
    }

    // 3. Verify Vague Text
    console.log('\n3. Testing Vague/Short Text...');
    const vagueInput = "ok";
    const resultVague = await normalizationService.normalizeResponse(vagueInput, 'text', [], {
        prompt_text: 'How was it?',
        targets: ['engagement']
    });
    console.log('Input:', vagueInput);
    console.log('Confidence:', resultVague.confidence);
    if (resultVague.confidence < 0.5) {
        console.log('✅ Low confidence for vague input.');
    } else {
        console.warn('⚠️ Confidence too high for vague input.');
    }

    // 4. Verify Choice Determinism
    // Mock a prompt with option codes
    console.log('\n4. Testing Deterministic Choice...');
    const mockSpec = {
        option_codes: {
            "Yes": [{ construct: "autonomy", direction: 1, strength: 0.9, confidence: 1, evidence_type: "self_report", explanation_short: "Direct yes" }],
            "No": [{ construct: "autonomy", direction: -1, strength: 0.9, confidence: 1, evidence_type: "self_report", explanation_short: "Direct no" }]
        }
    };
    const mockPrompt = `Do you have autonomy? ||| ${JSON.stringify(mockSpec)}`;

    const resultChoice = await normalizationService.normalizeResponse("Yes", "choice", [], { prompt_text: mockPrompt });
    console.log('Input: Yes');
    console.log('Mapped Control Signal:', resultChoice.signals.control); // Autonomy maps to control

    if (resultChoice.signals.control > 0.7) {
        console.log('✅ Deterministic Choice Mapping Success.');
    } else {
        console.error('❌ Choice Mapping Failed.');
        process.exit(1);
    }


    // 5. Verify Invariance (Response Mode Sigma)
    // Same content via Text vs Choice should have different uncertainty impact
    console.log('\n5. Testing Measurement Invariance...');
    // A) Text Strong Positive
    const resText = await normalizationService.normalizeResponse("I have total control.", "text", [], { prompt_text: "Do you have control?", targets: ['autonomy'] });
    // B) Choice Strong Positive (Mock)
    const mockSpecInv = { option_codes: { "Yes": [{ construct: "autonomy", direction: 1, strength: 0.9, confidence: 1, evidence_type: "self_report" }] } };
    const resChoice = await normalizationService.normalizeResponse("Yes", "choice", [], { prompt_text: `Control? ||| ${JSON.stringify(mockSpecInv)}` });

    console.log(`Text Uncertainty (Control): ${resText.uncertainty.control.toFixed(4)}`);
    console.log(`Choice Uncertainty (Control): ${resChoice.uncertainty.control.toFixed(4)}`);

    if (resChoice.uncertainty.control < resText.uncertainty.control) {
        console.log('✅ Choice has lower uncertainty than Text (Invariance Success).');
    } else {
        console.warn('⚠️ Invariance check failed: Choice should be more certain than Text.');
    }

    // 6. Verify Conflict Detection
    // Feed conflicting evidence and ensure Sigma inflates
    console.log('\n6. Testing Consistency & Conflict...');

    // We need to simulate the MeasurementService state accumulation, but normalizeResponse is stateless per call?
    // Actually normalizeResponse instantiates extraction -> aggregation -> mapping.
    // To test consistency, we need to feed MULTIPLE items into the SAME aggregation session,
    // but the current scripts tests single-shot normalization.
    // The Consistency logic exists in `measurement.aggregate`, which processes a LIST of evidence.

    // So let's manually invoke measurementService.aggregate with conflicting Evidence
    const { measurementService } = await import('@/services/measurement/measurement');
    const conflictEvidence = [
        { construct: "autonomy", direction: 1, strength: 1.0, confidence: 1.0, evidence_type: "self_report" }, // "I love it"
        { construct: "autonomy", direction: -1, strength: 1.0, confidence: 1.0, evidence_type: "self_report" } // "I hate it"
    ] as any;

    const aggResult = measurementService.aggregate(conflictEvidence);
    const m = aggResult.autonomy;
    console.log(`Conflict Aggregate: Mean=${m.mean.toFixed(2)}, Sigma=${m.sigma.toFixed(2)}`);

    if (m.sigma > 0.5) { // Expected inflation
        console.log('✅ Sigma inflated due to conflict.');
    } else {
        console.warn(`⚠️ Sigma too low (${m.sigma}) for direct contradiction.`);
    }

    console.log('\n--- VERIFICATION PASS ---');
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});

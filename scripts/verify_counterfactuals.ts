
import { loadEnv } from '@/lib/env/loadEnv';
loadEnv();

import { counterfactualEngine } from '@/services/counterfactuals/engine';

async function verify() {
    console.log('--- Verifying Structural Model: Counterfactuals ---');

    // Case 1: Increase Autonomy
    console.log('\n1. Simulation: Increase Autonomy');
    const sim1 = counterfactualEngine.simulateIntervention('autonomy', 'increase');

    // Check Engagement (Should Increase)
    const engagement = sim1.predicted_effects.find(e => e.target_construct === 'engagement');
    if (engagement && engagement.direction === 'increase') {
        console.log(`✅ Autonomy -> Engagement: ${engagement.direction} (Conf: ${engagement.confidence.toFixed(2)})`);
    } else {
        console.error('❌ Failed to predict Autonomy -> Engagement Increase');
        console.log(sim1.predicted_effects);
        process.exit(1);
    }

    // Case 2: Increase Role Clarity (Should inhibit Cognitive Dissonance)
    console.log('\n2. Simulation: Increase Role Clarity');
    const sim2 = counterfactualEngine.simulateIntervention('role_clarity', 'increase');
    const dissonance = sim2.predicted_effects.find(e => e.target_construct === 'cognitive_dissonance');

    if (dissonance && dissonance.direction === 'decrease') {
        console.log(`✅ Role Clarity -> Dissonance: ${dissonance.direction} (Conf: ${dissonance.confidence.toFixed(2)})`);
    } else {
        console.error('❌ Failed to predict Role Clarity -> Dissonance Decrease');
        process.exit(1);
    }

    console.log('\n--- COUNTERFACTUALS VERIFIED ---');
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});

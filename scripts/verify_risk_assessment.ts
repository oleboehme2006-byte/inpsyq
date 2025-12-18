
import { loadEnv } from '@/lib/env/loadEnv';
loadEnv();

import { riskAssessor } from '@/services/risk/assessor';

async function verify() {
    console.log('--- Verifying Structural Model: Risk Assessment ---');

    // 1. Epistemic Risk (High Sigma)
    console.log('\n1. Testing Epistemic Risk (Sigma 0.6)...');
    const risk1 = riskAssessor.assessRisk(0.6, [], 'individual_contributor', 10);
    console.log(`Vector: E=${risk1.vector.epistemic.toFixed(2)}, Eth=${risk1.vector.ethical}, Org=${risk1.vector.organizational}`);
    console.log(`Level: ${risk1.overall_level}, Blocking: ${risk1.blocking}`);

    if (risk1.blocking && risk1.vector.epistemic > 0.5) {
        console.log('✅ High Sigma blocked correctly.');
    } else {
        console.error('❌ Failed to block high uncertainty.');
        process.exit(1);
    }

    // 2. Ethical Risk (Severe Burnout Signal)
    console.log('\n2. Testing Ethical Risk (Severe Emotional Load)...');
    const risk2 = riskAssessor.assessRisk(0.1, [{ construct: 'emotional_load', severity: 'extreme_risk' }], 'individual_contributor', 10);
    console.log(`Vector: E=${risk2.vector.epistemic.toFixed(2)}, Eth=${risk2.vector.ethical.toFixed(2)}`);

    if (risk2.vector.ethical > 0.5) {
        console.log('✅ Severe Burnout triggered Ethical Risk.');
    } else {
        console.error('❌ Failed to trigger Ethical Risk.');
        process.exit(1);
    }

    console.log('\n--- RISK ASSESSMENT VERIFIED ---');
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});

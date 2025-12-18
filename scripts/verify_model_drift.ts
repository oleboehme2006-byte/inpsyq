
import { loadEnv } from '@/lib/env/loadEnv';
loadEnv();

import { diagnosticsService } from '@/services/model_diagnostics/tracker';

async function verify() {
    console.log('--- Verifying Structural Model: Diagnostics ---');

    // 1. Entropy Check (Low Entropy Simulation)
    console.log('\n1. Testing Entropy Decay (Clustered Data)...');
    // All scores are 0.5
    const clustered = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const entAlert = diagnosticsService.checkEntropy(clustered);

    if (entAlert && entAlert.type === 'entropy_decay') {
        console.log(`✅ Low Entropy flagged: ${entAlert.metric_value.toFixed(2)}`);
    } else {
        console.error('❌ Failed to flag low entropy.');
        process.exit(1);
    }

    // 2. Saturation Check
    console.log('\n2. Testing Construct Saturation...');
    // Many extremes
    const extremes = [0.99, 0.98, 0.01, 0.02, 0.5, 0.5, 0.99, 0.01, 0.99, 0.02];
    const satAlert = diagnosticsService.checkSaturation('autonomy', extremes);

    if (satAlert && satAlert.type === 'construct_saturation') {
        console.log(`✅ Saturation flagged: ${(satAlert.metric_value * 100).toFixed(0)}%`);
    } else {
        console.error('❌ Failed to flag saturation.');
        process.exit(1);
    }

    console.log('\n--- DIAGNOSTICS VERIFIED ---');
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});

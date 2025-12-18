
import { loadEnv } from '@/lib/env/loadEnv';
loadEnv();

import { rolePowerService } from '@/services/roles/service';
import { safeToFixed } from '@/lib/utils/safeNumber';

async function verify() {
    console.log('--- Verifying Structural Model: Role Power ---');

    // 1. Suppression Risk
    console.log('\n1. Testing Suppression Risk...');
    const riskIC = rolePowerService.getSuppressionRisk('individual_contributor');
    const riskExec = rolePowerService.getSuppressionRisk('executive');

    console.log(`IC Risk: ${safeToFixed(riskIC, 2)}`);
    console.log(`Exec Risk: ${safeToFixed(riskExec, 2)}`);

    if (riskIC > riskExec) {
        console.log('✅ IC Validation Risk > Exec Risk (Correct Power Asymmetry)');
    } else {
        console.error('❌ Role Power Logic inverted!');
        process.exit(1);
    }

    // 2. Signal Weighting
    console.log('\n2. Testing Signal Weighting (Trust Leadership)...');
    const weightIC = rolePowerService.getSignalWeight('individual_contributor', 'trust_leadership');
    const weightExec = rolePowerService.getSignalWeight('executive', 'trust_leadership');

    console.log(`IC Weight: ${weightIC}`);
    console.log(`Exec Weight: ${weightExec}`);

    if (weightIC > weightExec) {
        console.log('✅ IC Trust Signal has higher weight than Exec Self-Trust (Correct)');
    } else {
        console.error('❌ Failed weighting logic.');
        process.exit(1);
    }

    console.log('\n--- ROLE POWER VERIFIED ---');
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});

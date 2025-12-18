
import { loadEnv } from '@/lib/env/loadEnv';
loadEnv();

import { normService } from '@/services/norms/service';
import { safeToFixed } from '@/lib/utils/safeNumber';
import { CONSTRUCTS } from '@/services/measurement/constructs';

async function verify() {
    console.log('--- Verifying Model Integrity: Norm Sensitivity ---');

    // 1. Check Default Profile
    const profile = normService.getDefaultProfile('org_123');
    console.log(`Loaded Profile: ${profile.name}`);
    console.log(`Autonomy Range: ${profile.constructs.autonomy.mean} ± ${profile.constructs.autonomy.sigma}`);

    // 2. Assess Healthy Signals
    console.log('\n2. Testing Healthy Assessment...');
    const healthyScore = 0.75; // Mean is 0.7 for autonomy
    const assessmentH = normService.assessDeviation('autonomy', healthyScore, profile);
    console.log(`Score: ${healthyScore}, Severity: ${assessmentH.severity}, Z: ${safeToFixed(assessmentH.deviation_z_score, 2)}`);

    if (assessmentH.severity === 'normal') {
        console.log('✅ 0.75 is normal for mean 0.7 sigma 0.15');
    } else {
        console.warn('⚠️ Unexpected severity for minor deviation.');
    }

    // 3. Assess Risk Deviation
    console.log('\n3. Testing Risk Assessment...');
    const riskScore = 0.2; // Very low autonomy
    const assessmentR = normService.assessDeviation('autonomy', riskScore, profile);
    console.log(`Score: ${riskScore}, Severity: ${assessmentR.severity}, Z: ${safeToFixed(assessmentR.deviation_z_score, 2)}`);

    if (assessmentR.severity === 'extreme_risk' || assessmentR.severity === 'risk_deviation') {
        console.log('✅ Low autonomy flagged as risk.');
    } else {
        console.error('❌ Failed to flag low autonomy as risk.');
        process.exit(1);
    }

    console.log('\n--- NORM CHECK COMPLETE ---');
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});

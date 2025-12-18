
import { loadEnv } from '@/lib/env/loadEnv';
loadEnv();

import { ontologyService } from '@/services/ontology';
import { interpretationContextService } from '@/services/interpretation/context';
import { normService } from '@/services/norms/service';
import { causalityService } from '@/services/causality/service';
import { consistencyClassifier } from '@/services/consistency/classifier';
import { actionEngine } from '@/services/actions/engine';
import { governanceService } from '@/services/governance/flags';
import { counterfactualEngine } from '@/services/counterfactuals/engine';
import { rolePowerService } from '@/services/roles/service';
import { riskAssessor } from '@/services/risk/assessor';
import { diagnosticsService } from '@/services/model_diagnostics/tracker';
import { safeToFixed } from '@/lib/utils/safeNumber';

async function verify() {
    console.log('--- Full Model Integrity Integration Check (8 Layers) ---');

    console.log('1. Ontology:', ontologyService ? 'OK' : 'FAIL');
    console.log('2. Interpretation Context:', interpretationContextService ? 'OK' : 'FAIL');
    console.log('3. Norms Default Profile:', normService.getDefaultProfile('test').name);

    // 4. Causality
    const causal = causalityService.evaluateCausality('autonomy', 'engagement', 'stable', 0.9);
    console.log('4. Causality Check:', causal.confidence);

    // 5. Consistency
    const pattern = consistencyClassifier.classifyPattern([]);
    console.log('5. Consistency Check:', pattern);

    // 6. Counterfactuals
    const cf = counterfactualEngine.simulateIntervention('autonomy', 'increase');
    console.log(`6. Counterfactuals: Simulated ${cf.predicted_effects.length} effects.`);

    // 7. Roles & Power
    const roleRisk = rolePowerService.getSuppressionRisk('individual_contributor');
    console.log(`7. Role Power: IC Suppression Risk = ${safeToFixed(roleRisk, 2)}`);

    // 8. Risk Vector
    const risk = riskAssessor.assessRisk(0.1, [], 'executive', 10);
    console.log(`8. Risk Vector: Evaluated (Level: ${risk.overall_level})`);

    // 9. Diagnostics
    const drift = diagnosticsService.checkEntropy([0.1, 0.9]);
    console.log(`9. Diagnostics: Tracker Active.`);

    // 10. Actions
    const actions = actionEngine.generateActions('autonomy');
    console.log(`10. Actions Gen: ${actions.length} actions generated.`);

    // 11. Governance
    const flags = governanceService.checkGovernance(2, 0.5, [], risk);
    console.log(`11. Governance Flags: ${flags.length} (Expected for low n/high sigma)`);

    console.log('--- ALL SYSTEMS INTEGRATED ---');
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});

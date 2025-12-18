
import { AnalysedDriver } from './types';
import { PARAM_INFLUENCE, IS_ACTIONABLE } from './constants';
import { safeToFixed } from '@/lib/utils/safeNumber';

export function attributeDrivers(parameterMeans: Record<string, number>): { top_risks: AnalysedDriver[], top_strengths: AnalysedDriver[] } {
    const drivers: AnalysedDriver[] = [];

    // Analyze each parameter
    // We assume data is 0-1.
    // We need to know polarity. 
    // Usually in this system:
    // High Meaning/Safety/Trust = GOOD
    // High Load/Friction/Ambiguity = BAD

    // Let's define "Bad" direction explicitly or assume schema.
    // Convention: 
    // BAD: emotional_load, cognitive_load, autonomy_friction, role_ambiguity, cognitive_dissonance, trust_gap
    // GOOD: meaning, engagement, psych_safety, control, trust_peers, trust_leadership, social_cohesion, adaptive_capacity

    const NEGATIVE_PARAMS = new Set([
        'emotional_load', 'cognitive_load', 'autonomy_friction',
        'role_ambiguity', 'cognitive_dissonance', 'trust_gap'
    ]);

    for (const [param, val] of Object.entries(parameterMeans)) {
        const isNegative = NEGATIVE_PARAMS.has(param);

        // Impact: How much does it deviate from "Ideal"?
        // Ideal for Positive is 1.0, Ideal for Negative is 0.0.
        // Impact = Deviation.
        let deviation = 0;
        if (isNegative) deviation = val; // 0.8 load is 0.8 deviation
        else deviation = 1 - val;    // 0.2 safety is 0.8 deviation

        // Only classify as meaningful driver if deviation > 0.3
        if (deviation < 0.2) continue; // Noise

        drivers.push({
            parameter: param,
            label: param.replace(/_/g, ' '),
            impact: parseFloat(safeToFixed(deviation, 2)),
            direction: isNegative ? 'NEGATIVE' : 'POSITIVE', // Logic check: actually this field in Type means "Does it help or hurt". 
            // If it's a Risk, it hurts. If Strength, it helps.
            // Wait, "Risk" means it IS hurting. "Strength" means it IS helping.
            // Let's split by intent.

            // Actually, `attributeDrivers` is usually looking for "Why is state bad?". 
            // So we focus on Risks.

            influence_scope: PARAM_INFLUENCE[param] || 'SYSTEMIC',
            is_actionable: IS_ACTIONABLE[param] || false,
            explanation: `${param.replace(/_/g, ' ')} is ${isNegative ? 'high' : 'low'} (${safeToFixed(val, 2)}).`
        });
    }

    // Sort by Impact Descending
    drivers.sort((a, b) => b.impact - a.impact);

    return {
        top_risks: drivers.slice(0, 5),
        top_strengths: [] // TODO: Implement strengths if needed (low load, high safety)
    };
}

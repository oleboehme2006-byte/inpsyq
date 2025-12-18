import { RiskVector, RiskAssessment, RiskLevel } from './types';
import { PowerLevel } from '../roles/types';
import { DeviationSeverity } from '../norms/types';
import { Construct } from '../measurement/constructs';

export class RiskAssessor {

    public assessRisk(
        sigma: number,
        deviations: { severity: DeviationSeverity, construct: Construct }[],
        roleLevel: PowerLevel,
        sampleSize: number
    ): RiskAssessment {
        const vector: RiskVector = { epistemic: 0, ethical: 0, organizational: 0 };
        const flags: string[] = [];

        // 1. Epistemic Risk (Uncertainty)
        // Sigma > 0.4 is High. Sample < 3 is High.
        vector.epistemic = Math.min(1.0, sigma + (sampleSize < 3 ? 0.3 : 0.0));
        if (vector.epistemic > 0.4) flags.push('High Uncertainty');

        // 2. Ethical Risk (Harm)
        // Extreme deviations on sensitive constructs (e.g. psych_safety, emotional_load) could mean crisis.
        const sensitiveConstructs = ['psychological_safety', 'emotional_load', 'fairness'];
        const severeDeviations = deviations.filter(d =>
            (d.severity === 'extreme_risk' || d.severity === 'risk_deviation') &&
            sensitiveConstructs.includes(d.construct)
        );

        // If we have severe issues in sensitive areas, Ethical Risk goes up (Do no harm - maybe we shouldn't automate advice?)
        if (severeDeviations.length > 0) {
            vector.ethical = 0.6 + (severeDeviations.length * 0.1);
            flags.push('Ethical Sensitivity: Severe Psych Safety/Burnout signals detected.');
        }

        // 3. Organizational Risk (Politics)
        // If "Trust Leadership" is low AND source is "Executive" (Low Trust in Self? weird) or "IC" (Mutiny?)
        // Actually, Organization Risk is high if we report "Low Trust" based on small N or specific roles.
        // For now, let's say: If global deviations > 3, it's a "Crisis Report", which is politically risky.
        if (deviations.filter(d => d.severity !== 'normal').length > 3) {
            vector.organizational = 0.5;
            flags.push('High Organizational Turbulence');
        }

        // Determine Overall Level
        const maxRisk = Math.max(vector.epistemic, vector.ethical, vector.organizational);
        let overall: RiskLevel = 'low';
        if (maxRisk > 0.7) overall = 'critical';
        else if (maxRisk > 0.5) overall = 'high';
        else if (maxRisk > 0.3) overall = 'medium';

        return {
            vector,
            overall_level: overall,
            flags,
            blocking: overall === 'critical' || vector.epistemic > 0.5 // Block if too risky
        };
    }
}

export const riskAssessor = new RiskAssessor();

import { DeviationSeverity } from '../norms/types';
import { CausalConfidence } from '../causality/types';
import { RiskAssessment } from '../risk/types';

export type GovernanceFlagType = 'high_uncertainty' | 'ethical_sensitivity' | 'insufficient_data' | 'extreme_anomaly';

export interface GovernanceFlag {
    type: GovernanceFlagType;
    message: string;
    severity: 'warning' | 'blocking';
}

export class GovernanceService {

    public checkGovernance(
        sessionCount: number,
        globalSigma: number,
        deviations: { severity: DeviationSeverity }[],
        riskAssessment?: RiskAssessment
    ): GovernanceFlag[] {
        const flags: GovernanceFlag[] = [];

        // 0. Risk Assessment Integration
        if (riskAssessment) {
            if (riskAssessment.vector.epistemic > 0.5) {
                flags.push({ type: 'high_uncertainty', message: 'Risk Model: High Epistemic Uncertainty.', severity: 'blocking' });
            }
            if (riskAssessment.vector.ethical > 0.5) {
                flags.push({ type: 'ethical_sensitivity', message: 'Risk Model: High Ethical Risk.', severity: 'blocking' });
            }
            if (riskAssessment.vector.organizational > 0.7) {
                flags.push({ type: 'extreme_anomaly', message: 'Risk Model: Critical Organizational Instability.', severity: 'warning' });
            }
        }

        // 1. Insufficient Data
        if (sessionCount < 3) {
            flags.push({
                type: 'insufficient_data',
                message: 'Low n (Session Count < 3). Confidence limited.',
                severity: 'warning'
            });
        }

        // 2. High Uncertainty
        if (globalSigma > 0.4) {
            flags.push({
                type: 'high_uncertainty',
                message: 'Global Uncertainty > 0.4. Model is guessing.',
                severity: 'blocking'
            });
        }

        // 3. Extreme Anomalies (Ethical Check)
        const anomalies = deviations.filter(d => d.severity === 'extreme_risk');
        if (anomalies.length > 0) {
            flags.push({
                type: 'extreme_anomaly',
                message: `Extreme deviations detected: ${anomalies.length}. Human review required.`,
                severity: 'blocking'
            });
        }

        return flags;
    }
}

export const governanceService = new GovernanceService();

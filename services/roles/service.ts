import { PowerLevel, RoleProfile, PowerWeighting } from './types';

// Hardcoded map for simple hierarchy
const POWER_LEVELS: Record<PowerLevel, number> = {
    executive: 5,
    senior_management: 4,
    middle_management: 3,
    team_lead: 2,
    individual_contributor: 1,
    support: 0
};

export class RolePowerService {

    /**
     * Estimates the "Suppression Risk" (likelihood of self-censorship) based on power.
     * Lower power = Higher risk.
     */
    public getSuppressionRisk(level: PowerLevel): number {
        const p = POWER_LEVELS[level];
        // 1 (IC) -> 0.4 Risk
        // 5 (Exec) -> 0.1 Risk
        // Inverse relationship
        return Math.max(0.1, 0.5 - (p * 0.08));
    }

    /**
     * Returns a weighting multiplier for a signal based on who said it.
     * Executives might have higher weight on "Strategy" constructs?
     * Actually, InPsyq principle: "Truth is distributed".
     * However, we might weight "Leadership Trust" signals from ICs higher because they are the affected party.
     */
    public getSignalWeight(level: PowerLevel, construct: string): number {
        // Example: 'trust_leadership' is most valid coming from those managed (ICs).
        if (construct === 'trust_leadership') {
            if (level === 'individual_contributor' || level === 'support') return 1.2;
            if (level === 'executive') return 0.5; // Executives trusting themselves is biased.
        }

        // Example: 'role_clarity'
        // Managers usually think roles are clear. ICs know the truth.

        return 1.0; // Default
    }
}

export const rolePowerService = new RolePowerService();

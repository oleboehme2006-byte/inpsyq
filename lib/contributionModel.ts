import { PARAMETERS } from './constants';

export const PROFILES = ["WRP", "OUC", "TFP"] as const;
export type Profile = typeof PROFILES[number];
export type Parameter = typeof PARAMETERS[number];

/**
 * Scientifically Grounded Contribution Weights
 * 
 * Rationale:
 * - JD-R (Job Demands-Resources): OUC is driven by high demands (emotional_load) and low resources (control, psych_safety).
 * - SDT (Self-Determination Theory): WRP reflects low autonomous motivation (meaning) and low competence/relatedness (engagement, safety).
 * - Social Exchange Theory: TFP is explicitly relational, driven by imbalances in trust (leadership vs peers) and safety.
 * 
 * Note: These are priors for explainability.
 */
export const CONTRIBUTION_WEIGHTS: Record<Profile, Record<Parameter, number>> = {
    OUC: {
        emotional_load: 0.32,
        control: 0.22,
        psych_safety: 0.20,
        adaptive_capacity: 0.10,
        autonomy_friction: 0.08,
        engagement: 0.04,
        meaning: 0.02,
        trust_leadership: 0.01,
        trust_peers: 0.01,
        cognitive_dissonance: 0.00
    },
    WRP: {
        cognitive_dissonance: 0.28,
        meaning: 0.20,
        engagement: 0.18,
        psych_safety: 0.12,
        trust_leadership: 0.08,
        autonomy_friction: 0.06,
        control: 0.04,
        emotional_load: 0.02,
        trust_peers: 0.01,
        adaptive_capacity: 0.01
    },
    TFP: {
        trust_leadership: 0.42,
        trust_peers: 0.26,
        psych_safety: 0.12,
        engagement: 0.08,
        meaning: 0.04,
        control: 0.03,
        cognitive_dissonance: 0.03,
        autonomy_friction: 0.01,
        emotional_load: 0.01,
        adaptive_capacity: 0.00
    }
};

/**
 * Ensures weights sum to 1.0 for a given profile (sanity check mostly, as they are hardcoded).
 */
export function normalizeWeightsForProfile(profile: Profile): Record<Parameter, number> {
    const raw = CONTRIBUTION_WEIGHTS[profile];
    const sum = Object.values(raw).reduce((a, b) => a + b, 0);
    const normalized: any = {};
    for (const p of PARAMETERS) {
        normalized[p] = raw[p] / sum;
    }
    return normalized;
}

/**
 * Compute the specific parameter contribution weights for an employee
 * based on their profile mix.
 */
export function getContributionVector(profileScores: Record<Profile, number>): Record<Parameter, number> {
    const vector: Partial<Record<Parameter, number>> = {};

    for (const p of PARAMETERS) {
        let weight = 0;
        for (const profile of PROFILES) {
            const score = profileScores[profile] || 0;
            const contrib = CONTRIBUTION_WEIGHTS[profile][p] || 0;
            weight += score * contrib;
        }
        vector[p] = weight;
    }

    return vector as Record<Parameter, number>;
}

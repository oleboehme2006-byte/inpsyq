
export type PowerLevel = 'executive' | 'senior_management' | 'middle_management' | 'team_lead' | 'individual_contributor' | 'support';

export interface RoleProfile {
    role_id: string; // e.g. "senior_engineer"
    formal_role: string;
    power_level: PowerLevel;
    dependency_direction: 'downward' | 'upward' | 'lateral'; // Who do they depend on?
}

export interface PowerWeighting {
    construct_weights: Record<string, number>; // Weights for specific constructs (e.g., Managers weigh more on Strategy, ICs on Autonomy)
    suppression_risk: number; // 0-1 probability that this role self-censors
}

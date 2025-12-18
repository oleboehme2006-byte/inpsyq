
export interface ValueProfile {
    autonomy_preference: number; // 0.0 (Directive) to 1.0 (Laissez-faire)
    risk_appetite: number; // 0.0 (Conservative) to 1.0 (Avant-garde)
    feedback_directness: number; // 0.0 (Diplomatic) to 1.0 (Radical Candor)
    hierarchy_tolerance: number; // 0.0 (Flat) to 1.0 (Structured)
}

export const DEFAULT_VALUES: ValueProfile = {
    autonomy_preference: 0.8, // Tech default: High autonomy
    risk_appetite: 0.7,      // Tech default: Move fast
    feedback_directness: 0.8, // Tech default: Direct
    hierarchy_tolerance: 0.3  // Tech default: Low hierarchy
};

export const CONSERVATIVE_PROFILE: ValueProfile = {
    autonomy_preference: 0.4,
    risk_appetite: 0.2,
    feedback_directness: 0.5,
    hierarchy_tolerance: 0.8
};

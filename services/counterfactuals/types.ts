import { Construct } from '../measurement/constructs';
import { CausalConfidence } from '../causality/types';

export type InterventionDirection = 'increase' | 'decrease';

export interface CounterfactualEffect {
    target_construct: Construct; // The node being affected
    direction: 'increase' | 'decrease' | 'neutral';
    confidence: number; // 0-1
    causal_strength: CausalConfidence; // Inherited from ontology
    path_depth: number;
}

export interface CounterfactualSimulation {
    intervention: {
        construct: Construct;
        direction: InterventionDirection;
    };
    predicted_effects: CounterfactualEffect[];
    governance_flags: string[]; // Any warnings (e.g., "Low Confidence")
}

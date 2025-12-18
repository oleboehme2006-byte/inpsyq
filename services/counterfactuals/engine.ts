import { ontologyService } from '../ontology';
import { CounterfactualSimulation, InterventionDirection } from './types';
import { Construct } from '../measurement/constructs';

export class CounterfactualEngine {

    /**
     * Simulates: "What if we [Increase/Decrease] [Construct]?"
     */
    public simulateIntervention(
        construct: Construct,
        direction: InterventionDirection
    ): CounterfactualSimulation {
        const effects = ontologyService.getDownstreamEffects(construct, 3); // Depth 3

        const predicted = effects.map(effect => {
            // Determine Direction
            // If Edge positive: Increase -> Increase
            // If Edge negative (inhibits): Increase -> Decrease
            let predictedDir: 'increase' | 'decrease' | 'neutral' = 'neutral';

            const isPositiveLink = ['contributes_to', 'amplifies', 'requires', 'moderates'].includes(effect.type);

            if (direction === 'increase') {
                predictedDir = isPositiveLink ? 'increase' : 'decrease';
            } else {
                predictedDir = isPositiveLink ? 'decrease' : 'increase';
            }

            // Determine Causal Strength (Simple mapping for now)
            // Ideally we check causality service, but Ontology is the truth here.

            return {
                target_construct: effect.construct,
                direction: predictedDir,
                confidence: effect.path_strength * 0.9, // Degradation per hop
                causal_strength: effect.path_strength > 0.6 ? 'strong_causal' : 'weak_causal' as any,
                path_depth: effect.depth
            };
        });

        return {
            intervention: { construct, direction },
            predicted_effects: predicted,
            governance_flags: predicted.length === 0 ? ['No downstream effects found'] : []
        };
    }
}

export const counterfactualEngine = new CounterfactualEngine();

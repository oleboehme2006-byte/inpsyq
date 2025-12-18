import { Construct } from '../measurement/constructs';
import { CausalAnalysis } from './types';
import { ontologyService } from '../ontology';

export class CausalityService {

    /**
     * Evaluates whether a driver (Candidate) likely causes an outcome (State/Effect)
     * based on Model Integrity rules.
     */
    public evaluateCausality(
        driver: Construct,
        outcome: Construct,
        driverTrend: 'stable' | 'increasing' | 'decreasing' | 'volatile',
        driverSignalStrength: number
    ): CausalAnalysis {
        const reasoning: string[] = [];
        let score = 0;

        // 1. Check Ontology (Theory)
        // Does the graph say A -> B?
        const node = ontologyService.getNode(driver);
        const edge = node.outgoing.find(e => e.target === outcome);

        if (edge) {
            score += 0.4;
            reasoning.push(`Theoretical link exists (${edge.type})`);
        } else {
            // Check secondary path
            const downstream = ontologyService.getDownstreamEffects(driver, 2);
            if (downstream.find(e => e.construct === outcome)) {
                score += 0.2;
                reasoning.push('Indirect theoretical link found');
            }
        }

        // 2. Check Signal Strength
        if (driverSignalStrength > 0.8 || driverSignalStrength < 0.2) {
            score += 0.2;
            reasoning.push('Strong signal magnitude suggests impact');
        }

        // 3. Temporal Consistency (Persistence)
        if (driverTrend !== 'volatile') {
            score += 0.2;
            reasoning.push('Driver is temporally stable (persistent)');
        }

        // 4. Classification
        let confidence: 'correlational' | 'weak_causal' | 'strong_causal' = 'correlational';
        if (score >= 0.7) confidence = 'strong_causal';
        else if (score >= 0.4) confidence = 'weak_causal';

        return {
            driver,
            outcome,
            confidence,
            score,
            reasoning
        };
    }
}

export const causalityService = new CausalityService();

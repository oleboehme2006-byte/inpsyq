import { Construct } from '../measurement/constructs';

export type CausalConfidence = 'correlational' | 'weak_causal' | 'strong_causal';

export interface CausalAnalysis {
    driver: Construct;
    outcome: Construct;
    confidence: CausalConfidence;
    score: number; // 0-1 confidence logic score
    reasoning: string[];
}

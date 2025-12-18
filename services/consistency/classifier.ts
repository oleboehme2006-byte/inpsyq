import { Evidence } from '../measurement/evidence';

export type ConsistencyPattern = 'coherent' | 'ambivalent' | 'impression_management' | 'chaotic';

export class ConsistencyClassifier {

    public classifyPattern(evidenceList: Evidence[]): ConsistencyPattern {
        if (evidenceList.length < 3) return 'coherent'; // Not enough data to judge

        // 1. Check for Impression Management
        // High Uniformity + Perfect Scores often means "faking good"
        const avgStrength = evidenceList.reduce((sum, e) => sum + e.strength, 0) / evidenceList.length;
        const allPositive = evidenceList.every(e => e.direction === 1);

        if (allPositive && avgStrength > 0.9) {
            // Heuristic: Perfect scores across 3+ items is sus in psychology
            return 'impression_management';
        }

        // 2. Check for Ambivalence
        // Strong positives AND Strong negatives in related constructs
        // (Simplified check within same construct for now)
        // Group by construct
        const byConstruct: Record<string, Evidence[]> = {};
        for (const e of evidenceList) {
            if (!byConstruct[e.construct]) byConstruct[e.construct] = [];
            byConstruct[e.construct].push(e);
        }

        let ambivalenceFound = false;
        for (const key in byConstruct) {
            const items = byConstruct[key];
            const hasPos = items.some(i => i.direction === 1 && i.strength > 0.6);
            const hasNeg = items.some(i => i.direction === -1 && i.strength > 0.6);
            if (hasPos && hasNeg) {
                ambivalenceFound = true;
                break;
            }
        }

        if (ambivalenceFound) return 'ambivalent';

        return 'coherent';
    }
}

export const consistencyClassifier = new ConsistencyClassifier();

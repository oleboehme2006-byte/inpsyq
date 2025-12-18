import { Parameter, PARAMETERS } from '@/lib/constants';
import { Construct, Evidence } from './types';
import { EncodedSignal } from '@/services/normalizationService';

// Mapping Definition: Construct -> Target Parameters (with weights)
const MAPPING: Record<Construct, Partial<Record<Parameter, number>>> = {
    'psychological_safety': { 'psych_safety': 1.0, 'trust_peers': 0.3 },
    'trust': { 'trust_leadership': 0.5, 'trust_peers': 0.5 }, // Ambiguous trust splits
    'autonomy': { 'control': 0.9, 'autonomy_friction': -0.5 }, // Inverse friction
    'meaning': { 'meaning': 1.0, 'engagement': 0.4 },
    'fairness': { 'trust_leadership': 0.7, 'psych_safety': 0.3 },
    'workload': { 'emotional_load': 0.8, 'adaptive_capacity': -0.3 },
    'role_clarity': { 'control': 0.4, 'cognitive_dissonance': -0.6 },
    'social_support': { 'trust_peers': 0.8, 'psych_safety': 0.2 },
    'learning_climate': { 'adaptive_capacity': 0.7, 'growth': 0.5 } as any, // 'growth' not in core params? Ignore if strict.
    'leadership_quality': { 'trust_leadership': 0.9, 'control': 0.2 },
    'adaptive_capacity': { 'adaptive_capacity': 1.0 },
    'engagement': { 'engagement': 1.0 }
};

export function mapEvidenceToSignals(evidenceList: Evidence[]): EncodedSignal {
    // Initialize
    const signals: Record<Parameter, number> = {} as any;
    const uncertainty: Record<Parameter, number> = {} as any;
    const counts: Record<Parameter, number> = {} as any;

    // Default Unknown State
    PARAMETERS.forEach(p => {
        signals[p] = 0.5;
        uncertainty[p] = 0.3; // High uncertainty baseline
        counts[p] = 0;
    });

    if (!evidenceList || evidenceList.length === 0) {
        return {
            signals,
            uncertainty,
            confidence: 0.0,
            flags: { too_short: true, nonsense: false, self_harm_risk: false },
            topics: []
        };
    }

    let globalConfidenceAccumulator = 0;

    for (const ev of evidenceList) {
        const map = MAPPING[ev.construct];
        if (!map) continue;

        // Apply Evidence
        Object.entries(map).forEach(([paramKey, weight]) => {
            const p = paramKey as Parameter;
            // Check if p is valid core parameter
            if (!PARAMETERS.includes(p)) return;

            const w = Math.abs(weight);
            const sign = Math.sign(weight); // +1 or -1

            // Calculate Value Contribution (0..1) based on Direction & Strength
            // Direct: 0.5 + (dir * strength * 0.5)
            // e.g. Dir=1, Str=1.0 => 1.0
            // e.g. Dir=-1, Str=1.0 => 0.0
            // e.g. Dir=1, Str=0.5 => 0.75
            let rawValue = 0.5 + (ev.direction * ev.strength * 0.5);

            // If mapping weight is negative (inverse relationship), flip the value around 0.5
            if (sign === -1) {
                rawValue = 1.0 - rawValue;
            }

            // Weighted Average Accumulation
            const current = signals[p];
            const n = counts[p];

            // Update average
            signals[p] = ((current * n) + (rawValue * w)) / (n + w);
            counts[p] += w;

            // Reduce uncertainty based on evidence confidence
            // More evidence = less uncertainty
            uncertainty[p] = Math.max(0.05, uncertainty[p] * (1 - (ev.confidence * 0.5)));
        });

        globalConfidenceAccumulator += ev.confidence;
    }

    const avgConf = globalConfidenceAccumulator / evidenceList.length;

    return {
        signals,
        uncertainty,
        confidence: avgConf,
        flags: { too_short: false, nonsense: false, self_harm_risk: false },
        topics: evidenceList.map(e => e.construct)
    };
}

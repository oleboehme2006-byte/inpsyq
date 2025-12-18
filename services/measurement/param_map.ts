
import { Parameter, PARAMETERS } from '@/lib/constants';
import { Construct, CONSTRUCTS } from './constructs';
import { ConstructMeasurement } from './measurement';
import { VERSIONS } from './versions';

// Mapping: Construct -> Core Frozen Parameters
const MAPPING: Record<Construct, Partial<Record<Parameter, number>>> = {
    'psychological_safety': { 'psych_safety': 1.0, 'trust_peers': 0.3 },
    'trust_leadership': { 'trust_leadership': 1.0, 'psych_safety': 0.5 },
    'trust_peers': { 'trust_peers': 1.0, 'psych_safety': 0.3 },
    'autonomy': { 'control': 0.9, 'autonomy_friction': -0.5 },
    'meaning': { 'meaning': 1.0, 'engagement': 0.4 },
    'fairness': { 'trust_leadership': 0.6 },
    'workload': { 'emotional_load': 0.8, 'adaptive_capacity': -0.3 },
    'role_clarity': { 'control': 0.4, 'cognitive_dissonance': -0.6 },
    'social_support': { 'trust_peers': 0.8, 'psych_safety': 0.2 },
    'learning_climate': { 'adaptive_capacity': 0.7 },
    'adaptive_capacity': { 'adaptive_capacity': 1.0 },
    'engagement': { 'engagement': 1.0 },
    'cognitive_dissonance': { 'cognitive_dissonance': 1.0 },
    'emotional_load': { 'emotional_load': 1.0 }
};

export interface EncodedSignal {
    signals: Record<Parameter, number>;
    uncertainty: Record<Parameter, number>;
    confidence: number;
    flags: {
        too_short: boolean;
        nonsense: boolean;
        self_harm_risk: boolean;
    };
    topics: string[];
    meta?: {
        measurement_version: string;
    };
}

export function mapMeasurementsToSignals(measurements: Record<Construct, ConstructMeasurement>): EncodedSignal {
    const signals: Record<Parameter, number> = {} as any;
    const uncertainty: Record<Parameter, number> = {} as any;
    const counts: Record<Parameter, number> = {} as any;

    // Initialize defaults (0.5 neutral, high uncertainty)
    PARAMETERS.forEach(p => {
        signals[p] = 0.5;
        uncertainty[p] = 0.3;
        counts[p] = 0;
    });

    let totalConstructs = 0;
    let totalConfidence = 0;

    // Iterate over Measured Constructs
    Object.values(measurements).forEach(m => {
        const map = MAPPING[m.construct];
        if (!map) return;

        totalConstructs++;
        totalConfidence += (1 - m.sigma); // Sigma is uncertainty, so 1-sigma is confidence-ish

        Object.entries(map).forEach(([paramKey, weight]) => {
            const p = paramKey as Parameter;
            if (!PARAMETERS.includes(p)) return;

            const w = Math.abs(weight);
            const sign = Math.sign(weight);

            let rawValue = m.mean;

            // If relationship is inverse
            if (sign === -1) {
                rawValue = 1.0 - rawValue;
            }

            // Logistic Saturation Curve for Updates
            // Instead of linear average, we want parameters to be "sticky" near extremes (0/1)
            // and responsive in the middle, but we also want to dampen massive swings.

            // 1. Calculate Delta
            const delta = rawValue - signals[p];

            // 2. Apply Saturation (Dampen if already strong and delta is same direction)
            // Governance Cap:
            // If we have little history (n < 3), allow larger swings (Cold Start).
            // If established (n > 3), clamp to stability limit (0.15).

            const n = counts[p];
            let maxDelta = 0.15;
            if (n < 3.0) {
                maxDelta = 0.4; // Cold Start Booster
            }

            const cappedDelta = Math.max(-maxDelta, Math.min(maxDelta, delta));

            // 3. Update Signal
            // New Signal = Current + (CappedDelta * Weight * Confidence)

            const derivedUncertainty = m.sigma; // This was previously defined later, moved up for use
            const updateMagnitude = cappedDelta * w * (1 - derivedUncertainty);
            signals[p] = Math.max(0.01, Math.min(0.99, signals[p] + updateMagnitude));

            counts[p] += w;

            // Inherit uncertainty from measurement sigma
            uncertainty[p] = Math.min(uncertainty[p], derivedUncertainty);
        });
    });

    return {
        signals,
        uncertainty,
        confidence: totalConstructs > 0 ? totalConfidence / totalConstructs : 0,
        flags: { too_short: false, nonsense: false, self_harm_risk: false },
        topics: Object.keys(measurements),
        meta: {
            measurement_version: VERSIONS.PARAM_MAP + '-governed'
        }
    };
}

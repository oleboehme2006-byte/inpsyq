import { CONSTRUCTS, Construct } from '../measurement/constructs';
import { NormProfile, NormAssessment, DeviationSeverity } from './types';

// Default Global Norms (Placeholder for Startup/Tech context)
const DEFAULT_GLOBAL_NORM: Record<Construct, { mean: number, sigma: number }> = {
    autonomy: { mean: 0.7, sigma: 0.15 }, // Tech expects high autonomy
    psychological_safety: { mean: 0.75, sigma: 0.12 }, // Critical
    trust_leadership: { mean: 0.65, sigma: 0.2 },
    trust_peers: { mean: 0.7, sigma: 0.15 },
    meaning: { mean: 0.6, sigma: 0.2 },
    fairness: { mean: 0.6, sigma: 0.2 },
    workload: { mean: 0.5, sigma: 0.2 }, // 0.5 is balanced
    role_clarity: { mean: 0.7, sigma: 0.15 },
    social_support: { mean: 0.65, sigma: 0.18 },
    learning_climate: { mean: 0.6, sigma: 0.2 },
    adaptive_capacity: { mean: 0.6, sigma: 0.15 },
    engagement: { mean: 0.7, sigma: 0.15 },
    cognitive_dissonance: { mean: 0.3, sigma: 0.15 }, // Low is good
    emotional_load: { mean: 0.4, sigma: 0.2 } // Lower is better
};

export class NormService {

    public getDefaultProfile(orgId: string): NormProfile {
        const ranges: any = {};
        for (const c of CONSTRUCTS) {
            const def = DEFAULT_GLOBAL_NORM[c];
            ranges[c] = {
                mean: def.mean,
                sigma: def.sigma,
                min_healthy: Math.max(0, def.mean - 2 * def.sigma),
                max_healthy: Math.min(1, def.mean + 2 * def.sigma)
            };
        }
        return {
            id: 'default_tech_startup',
            name: 'Global Tech Benchmark',
            organization_id: orgId,
            constructs: ranges
        };
    }

    public assessDeviation(construct: Construct, score: number, profile: NormProfile): NormAssessment {
        const norm = profile.constructs[construct];
        if (!norm) {
            // Fallback if missing
            return { construct, raw_score: score, deviation_z_score: 0, severity: 'normal', is_aligned: true };
        }

        const zScore = (score - norm.mean) / norm.sigma;
        const absZ = Math.abs(zScore);

        let severity: DeviationSeverity = 'normal';
        if (absZ > 3.0) severity = 'extreme_risk';
        else if (absZ > 2.0) severity = 'risk_deviation';
        else if (absZ > 1.0) severity = 'healthy_deviation';

        // Contextual Logic: High score in "Burnout" (emotional_load) is bad, but low is good.
        // For positive constructs (Autonomy), Low is bad.
        // Current simplistic Z-score just measures distance. 
        // We need explicit "polarity" in norms or constructs.
        // For now, assume any 2-sigma deviation is "Noteworthy" (Risk if bad direction, outlier if good).

        return {
            construct,
            raw_score: score,
            deviation_z_score: zScore,
            severity,
            is_aligned: absZ <= 1.0
        };
    }
}

export const normService = new NormService();

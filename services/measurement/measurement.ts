
import { Construct } from './constructs';
import { Evidence } from './evidence';
import { VERSIONS } from './versions';

export interface ConstructMeasurement {
    construct: Construct;
    mean: number; // 0.0 to 1.0 (aggregated value)
    sigma: number; // 0.0 to 1.0 (uncertainty)
    sample_size: number; // Weighted count of evidence
    sources: {
        text_count: number;
        choice_count: number;
    };
    version: string;
}

export class MeasurementService {

    /**
     * Aggregates raw evidence into construct-level measurements.
     */
    aggregate(evidenceList: Evidence[]): Record<Construct, ConstructMeasurement> {
        const results: Partial<Record<Construct, ConstructMeasurement>> = {};

        for (const ev of evidenceList) {
            if (!results[ev.construct]) {
                results[ev.construct] = {
                    construct: ev.construct,
                    mean: 0.5, // Start completely uncertain/neutral
                    sigma: 0.4, // High initial uncertainty
                    sample_size: 0,
                    sources: { text_count: 0, choice_count: 0 },
                    version: VERSIONS.MEASUREMENT
                };
            }

            const m = results[ev.construct]!;

            // Calculate Value Contribution (0..1) based on Direction & Strength
            // Direct: 0.5 + (dir * strength * 0.5)
            let rawValue = 0.5 + (ev.direction * ev.strength * 0.5);

            // --- INVARIANCE LOGIC ---
            // Sigma varies by response origin (Slider < Choice < Text)
            // If evidence doesn't specify source type info, assume Text (highest uncertainty)
            let typeSigma = 0.2; // Default (Medium)

            // Heuristic to guess source type if not explicit in Evidence
            // Ideally Evidence should carry 'source_type' or we check evidence_type
            if (ev.evidence_type === 'self_report' && ev.strength === 1.0 && !ev.explanation_short) {
                // Likely a Slider/Rating or direct Choice
                typeSigma = 0.1;
            } else if (ev.evidence_type === 'affect' || ev.explanation_short) {
                // Text / Inferred
                typeSigma = 0.3;
            }

            // --- CONSISTENCY CHECK ---
            // If new signal strongly contradicts current mean (diff > 0.5), we have a conflict.
            // Do NOT overwrite. Inflate uncertainty.
            const conflictDelta = Math.abs(m.mean - rawValue);
            let consistencyWeight = 1.0;

            if (m.sample_size > 0.5 && conflictDelta > 0.5) {
                // Conflict!
                // 1. Reduce weight of this new evidence (dampening)
                consistencyWeight = 0.5;
                // 2. Inflate sigma of the construct (add uncertainty)
                m.sigma = Math.min(1.0, m.sigma + 0.2);
            }

            // Bayesian-ish Update
            const weight = ev.confidence * consistencyWeight;

            // Update Mean
            m.mean = ((m.mean * m.sample_size) + (rawValue * weight)) / (m.sample_size + weight);

            // Update Sigma
            // Target sigma is based on input type quality (typeSigma)
            // We move current sigma towards typeSigma, but reduced by sample size
            const targetSigma = typeSigma;
            // Standard error reduction: sigma_new = 1 / sqrt(n) roughly
            // Here: multiplicative decay
            m.sigma = Math.max(0.05, (m.sigma * m.sample_size + targetSigma * weight) / (m.sample_size + weight));


            m.sample_size += weight;
            if (ev.source_id?.includes('text') || ev.explanation_short) m.sources.text_count++;
            else m.sources.choice_count++;
        }

        return results as Record<Construct, ConstructMeasurement>;
    }
}

export const measurementService = new MeasurementService();

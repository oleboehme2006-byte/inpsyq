import { DiagnosticAlert } from './types';
import { Construct } from '../measurement/constructs';
import { safeToFixed, safePercent } from '@/lib/utils/safeNumber';

export class DiagnosticsService {

    /**
     * Checks for "Entropy Decay" (Model getting lazy/repetitive).
     * @param recentDistribution Distribution of scores [0.1, 0.5, 0.9...]
     */
    public checkEntropy(recentScores: number[]): DiagnosticAlert | null {
        if (recentScores.length < 10) return null;

        // Calculate Shannon Entropy roughly/binning
        const bins = [0, 0, 0, 0, 0]; // 0-0.2, 0.2-0.4, ...
        recentScores.forEach(s => {
            const bin = Math.min(4, Math.floor(s * 5));
            bins[bin]++;
        });

        const total = recentScores.length;
        const probs = bins.map(c => c / total).filter(p => p > 0);
        const entropy = -probs.reduce((sum, p) => sum + (p * Math.log2(p)), 0);

        // Max entropy for 5 bins is log2(5) ~= 2.32
        // Low entropy means clustering (bias/saturation).
        if (entropy < 1.0) {
            return {
                type: 'entropy_decay',
                severity: 'warning',
                message: `Low Entropy (${safeToFixed(entropy, 2)}). Model outputs are clustering excessively.`,
                metric_value: entropy
            };
        }
        return null;
    }

    /**
     * Checks for "Saturation" (Scores stuck at 0 or 1).
     */
    public checkSaturation(construct: Construct, scores: number[]): DiagnosticAlert | null {
        if (scores.length < 10) return null;

        const extremeCount = scores.filter(s => s > 0.95 || s < 0.05).length;
        const saturationRate = extremeCount / scores.length;

        if (saturationRate > 0.3) {
            return {
                type: 'construct_saturation',
                severity: 'critical',
                message: `Construct '${construct}' is saturated (${safePercent(saturationRate)} extremes). Governance adjustment needed.`,
                metric_value: saturationRate
            };
        }
        return null;
    }
}

export const diagnosticsService = new DiagnosticsService();

import { query } from '../db/client';
import { Parameter, MIN_VARIANCE, MAX_VARIANCE, R_MULTIPLIER } from '../lib/constants';

interface LatentState {
    mean: number;
    variance: number;
}

export class InferenceEngine {

    /**
     * Bayesian update algorithm.
     * m' = m + K*(y - m)
     * v' = (1 - K)*v + 0.01 (process noise)
     * K = v / (v + R)
     */
    async updateState(userId: string, signalMean: number, signalUncertainty: number, parameter: Parameter, confidence: number, isNonsense: boolean) {
        if (isNonsense) return; // Skip update

        // Get current state
        const res = await query(`
            SELECT mean, variance FROM latent_states 
            WHERE user_id = $1 AND parameter = $2
        `, [userId, parameter]);

        let currentMean = 0.5;
        let currentVariance = 0.25;

        if (res.rows.length > 0) {
            currentMean = res.rows[0].mean;
            currentVariance = res.rows[0].variance;
        }

        // Calculate R (Observation Noise)
        // Heuristic: If confidence is low, R is high.
        // Base R could be signalUncertainty^2 or just signalUncertainty.
        // Prompt says: If confidence < 0.55 -> R = R * 2.5

        let R = signalUncertainty; // Using uncertainty as base R
        if (confidence < 0.55) {
            R = R * R_MULTIPLIER;
        }

        // Kalman Gain
        const K = currentVariance / (currentVariance + R);

        // Update Mean
        // y is the new signal (signalMean)
        let newMean = currentMean + K * (signalMean - currentMean);

        // Clamp Mean [0, 1]
        newMean = Math.max(0, Math.min(1, newMean));

        // Update Variance
        // v' = (1 - K)*v + 0.01
        let newVariance = (1 - K) * currentVariance + 0.01;

        // Clamp Variance [0.0025, 0.25]
        newVariance = Math.max(MIN_VARIANCE, Math.min(MAX_VARIANCE, newVariance));

        // Persist
        await query(`
            INSERT INTO latent_states (user_id, parameter, mean, variance, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (user_id, parameter) 
            DO UPDATE SET mean = $3, variance = $4, updated_at = NOW()
        `, [userId, parameter, newMean, newVariance]);

        return { mean: newMean, variance: newVariance };
    }
}

export const inferenceEngine = new InferenceEngine();

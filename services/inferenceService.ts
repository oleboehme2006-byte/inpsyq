import { query } from '../db/client';
import { Parameter, MIN_VARIANCE, MAX_VARIANCE, R_MULTIPLIER } from '../lib/constants';
import { safeToFixed } from '@/lib/utils/safeNumber';

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
        if (isNonsense) {
            console.log(`[Inference] Skipping ${parameter} for user ${userId} due to NONSENSE flag.`);
            return;
        }

        // Get current state
        const res = await query(`
            SELECT mean, variance FROM latent_states 
            WHERE user_id = $1 AND parameter = $2
        `, [userId, parameter]);

        let currentMean = 0.5;
        let currentVariance = 0.15; // Initial variance from spec

        if (res.rows.length > 0) {
            currentMean = res.rows[0].mean;
            currentVariance = res.rows[0].variance;
        }

        // Calculate R (Observation Noise)
        // R = sigma^2
        let R = signalUncertainty * signalUncertainty;

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

        // DEBUG LOG
        console.log(`[Inference] UID=${userId.slice(0, 8)} Param=${parameter}`);
        console.log(`   PRIOR: m=${safeToFixed(currentMean, 3)} v=${safeToFixed(currentVariance, 3)}`);
        console.log(`   OBS:   y=${safeToFixed(signalMean, 3)} R=${safeToFixed(R, 3)} (conf=${confidence})`);
        console.log(`   POST:  m=${safeToFixed(newMean, 3)} v=${safeToFixed(newVariance, 3)}`);

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

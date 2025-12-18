
import { query } from '@/db/client';
import { CONSTRUCTS, Construct } from './constructs';
import { MeasurementContext, Trend } from './context';
import { calculateEpistemicState } from './epistemics';

export class MeasurementService {

    /**
     * Reconstructs the full measurement context for a user for all constructs.
     * Integrates simple Latent State (Mean/Var) with Temporal History (Trend/Volatility).
     */
    async getContexts(userId: string): Promise<MeasurementContext[]> {
        // 1. Fetch Current Latent States (The "Now")
        const statesRes = await query(`
            SELECT parameter, mean, variance, updated_at 
            FROM latent_states 
            WHERE user_id = $1
        `, [userId]);

        const stateMap = new Map<string, { mean: number, variance: number, updated_at: Date }>();
        statesRes.rows.forEach(r => stateMap.set(r.parameter, r));

        // 2. Fetch Historical Aggregates (The "Past") for Trend/Volatility
        // We use the last 5 weeks of aggregates to determine stability.
        const historyRes = await query(`
            SELECT week_start, construct_aggregates 
            FROM user_weekly_aggregates 
            WHERE user_id = $1 
            ORDER BY week_start DESC 
            LIMIT 5
        `, [userId]);

        const historyRows = historyRes.rows;

        // 3. Build Contexts
        const contexts: MeasurementContext[] = [];

        for (const construct of CONSTRUCTS) {
            const state = stateMap.get(construct);

            // --- Trend & Volatility Calculation ---
            // Extract history for this specific construct
            const values = historyRows
                .map(r => (r.construct_aggregates as any)?.[construct])
                .filter(v => typeof v === 'number')
                .map(Number)
                .reverse(); // Chronological: Oldest -> Newest

            let volatility = 0;
            let trend: Trend = 'unknown';

            if (values.length >= 2) {
                // Volatility (Std Dev)
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
                volatility = Math.sqrt(variance);

                // Trend (Simple Delta)
                const last = values[values.length - 1];
                const first = values[0];
                const delta = last - first;

                if (Math.abs(delta) < 0.1) trend = 'stable';
                else if (delta > 0) trend = 'up';
                else trend = 'down';
            } else {
                trend = 'stable'; // Default if no history
            }

            // --- Construct MCO ---
            const lastObserved = state ? new Date(state.updated_at) : null;
            const sigma = state ? Math.sqrt(state.variance) : null;

            // Proxy Observation Count:
            // If we have a state, we have at least 1 observation. 
            // If we have history rows, we have more.
            // We'll use a heuristic: if state exists, count = 1 + (values.length * 3) (assuming ~3 items per week).
            // This is rough but sufficient for "Ignorant" (0) vs "Some" (>0).
            const count = state ? (1 + values.length * 3) : 0;

            const epistemic_state = calculateEpistemicState(
                sigma,
                volatility,
                trend,
                count
            );

            contexts.push({
                user_id: userId,
                construct: construct,
                posterior_mean: state ? state.mean : null,
                posterior_sigma: sigma,
                volatility,
                observation_count: count,
                last_observed_at: lastObserved,
                trend,
                epistemic_state
            });
        }

        return contexts;
    }
}

export const measurementService = new MeasurementService();

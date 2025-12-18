import { query } from '@/db/client';
import { CONSTRUCTS, Construct } from '../measurement/constructs';

export interface ConstructHistory {
    construct: Construct;
    trend: 'stable' | 'increasing' | 'decreasing' | 'volatile';
    volatility: number; // 0.0 to 1.0 (std dev of normalized scores)
    last_value: number;
    baseline: number; // Avg of last 5 sessions
    days_since_change: number;
}

export interface InterpretationContext {
    user_id: string;
    session_count: number;
    significant_history: ConstructHistory[]; // Only notable shifts
    recent_topics: string[]; // Last 3 sessions topics
}

export class InterpretationContextService {

    async getContext(userId: string): Promise<InterpretationContext> {
        // 1. Fetch historical aggregates
        // We look at `user_weekly_aggregates` but for simplicity in this upgrade, 
        // let's look at raw `user_state_snapshots` if they existed, or compute from `responses`.
        // The frozen core calculates signals. We can query `user_weekly_aggregates` for trends.

        // Query last 5 weeks of aggregates
        const result = await query(
            `SELECT week_start, construct_aggregates 
             FROM user_weekly_aggregates 
             WHERE user_id = $1 
             ORDER BY week_start DESC 
             LIMIT 5`,
            [userId]
        );
        const historyRows = result.rows;

        if (historyRows.length === 0) {
            return {
                user_id: userId,
                session_count: 0,
                significant_history: [],
                recent_topics: []
            };
        }

        const significantHistory: ConstructHistory[] = [];

        // Simple Trend Analysis
        for (const construct of CONSTRUCTS) {
            const values = historyRows
                .map(r => (r.construct_aggregates as any)?.[construct])
                .filter(v => v !== undefined && v !== null)
                .map(Number)
                .reverse(); // Chronological order

            if (values.length < 2) continue;

            // Calculate Volatility (Std Dev)
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
            const volatility = Math.sqrt(variance);

            // Calculate Trend (Linear Slope approx)
            const last = values[values.length - 1];
            const first = values[0];
            const delta = last - first;

            let trend: ConstructHistory['trend'] = 'stable';
            if (volatility > 0.2) trend = 'volatile';
            else if (delta > 0.15) trend = 'increasing';
            else if (delta < -0.15) trend = 'decreasing';

            // Only include if meaningful
            if (trend !== 'stable' || volatility > 0.2 || values.length > 3) {
                significantHistory.push({
                    construct,
                    trend,
                    volatility,
                    last_value: last,
                    baseline: mean,
                    days_since_change: 0 // Placeholder
                });
            }
        }

        return {
            user_id: userId,
            session_count: historyRows.length,
            significant_history: significantHistory,
            recent_topics: [] // Logic to fetch topics would go here (from interaction logs)
        };
    }
}

export const interpretationContextService = new InterpretationContextService();

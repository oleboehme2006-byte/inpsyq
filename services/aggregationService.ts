import { query } from '../db/client';
import { Parameter } from '../lib/constants';

export class AggregationService {
    async runWeeklyAggregation(orgId: string, teamId: string, weekStart: Date) {
        // Calculate Means and Uncertainty for the team

        // Fetch all latent states for team users
        const users = await query(`SELECT user_id FROM users WHERE team_id = $1`, [teamId]);
        if (users.rows.length === 0) return;

        const parameterMeans: Record<string, number> = {};
        const parameterUncertainty: Record<string, number> = {};
        const indices: Record<string, number> = {
            'team_health': 0 // Placeholder index
        };

        // Initialize aggregators
        // For a real implementation, we'd do a proper SQL aggregation or weighted average
        // Simplification: Average of means, Average of Variances (approx uncertainty)

        const aggregatedMeans: Record<string, number[]> = {};
        const aggregatedVars: Record<string, number[]> = {};

        for (const user of users.rows) {
            const states = await query(`SELECT parameter, mean, variance FROM latent_states WHERE user_id = $1`, [user.user_id]);
            states.rows.forEach(r => {
                if (!aggregatedMeans[r.parameter]) aggregatedMeans[r.parameter] = [];
                if (!aggregatedVars[r.parameter]) aggregatedVars[r.parameter] = [];
                aggregatedMeans[r.parameter].push(r.mean);
                aggregatedVars[r.parameter].push(r.variance);
            });
        }

        // Compute averages
        for (const param of Object.keys(aggregatedMeans)) {
            const means = aggregatedMeans[param];
            const vars = aggregatedVars[param];

            const avgMean = means.reduce((a, b) => a + b, 0) / means.length;
            const avgVar = vars.reduce((a, b) => a + b, 0) / vars.length;

            parameterMeans[param] = avgMean;
            parameterUncertainty[param] = Math.sqrt(avgVar); // Stdev estimate
        }

        // Simple Index Calculation (Mean of all positive params - Mean of negative ones?)
        // Placeholder "Health" = Average of everything for now
        const allMeans = Object.values(parameterMeans);
        indices['team_health'] = allMeans.length > 0 ? allMeans.reduce((a, b) => a + b, 0) / allMeans.length : 0;

        await query(`
            INSERT INTO org_aggregates_weekly (org_id, team_id, week_start, parameter_means, parameter_uncertainty, indices)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (org_id, team_id, week_start)
            DO UPDATE SET parameter_means = $4, parameter_uncertainty = $5, indices = $6
        `, [orgId, teamId, weekStart, parameterMeans, parameterUncertainty, indices]);
    }
}

export const aggregationService = new AggregationService();

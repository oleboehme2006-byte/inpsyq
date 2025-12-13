import { query } from '../db/client';
import { getContributionVector, PROFILES } from '../lib/contributionModel';
import { profileService } from './profileService';

type ParamKey =
    | 'control'
    | 'meaning'
    | 'engagement'
    | 'trust_peers'
    | 'psych_safety'
    | 'emotional_load'
    | 'trust_leadership'
    | 'adaptive_capacity'
    | 'autonomy_friction'
    | 'cognitive_dissonance';

interface Contributor {
    user_id: string;
    normalized_weight: number;
    employee_mean: number;
    profile_scores: Record<string, number>;
    confidence: number;
}

export class AggregationService {

    /**
     * Compute Weekly Aggregates for an Organization/Team
     * Derived from Employee Profiles snapshots using Contribution Model
     */
    async runWeeklyAggregation(orgId: string, teamId: string, weekStart: Date) {

        // 1. Check active user count (k_threshold)
        const teamInfo = await query(`
            SELECT k_threshold FROM orgs WHERE org_id = $1
        `, [orgId]);

        let k = 7;
        if (teamInfo.rows.length > 0) {
            k = teamInfo.rows[0].k_threshold || 7;
        }

        // 2. Fetch Employee Profiles for this week
        // We also need user_id for breakdown
        const profilesRes = await query(`
            SELECT user_id, parameter_means, parameter_uncertainty, profile_type_scores, confidence 
            FROM employee_profiles 
            WHERE team_id = $1 AND week_start = $2
        `, [teamId, weekStart]);

        const validProfiles = profilesRes.rows;

        if (validProfiles.length < k) {
            console.log(`[Aggregation] Skipped team ${teamId} week ${weekStart.toISOString().slice(0, 10)} due to low participation (${validProfiles.length} < ${k})`);
            return;
        }

        // 3. Compute Aggregates using Contribution Model

        const parameterMeans: Record<string, number> = {};
        const parameterUncertainty: Record<string, number> = {};

        // Accumulators for weighted sum
        // We'll need to know all parameters.
        const allParams = Object.keys(validProfiles[0].parameter_means);

        // Breakdown structure
        const breakdown: Record<string, any> = {
            parameter_contributions: {},
            profile_weight_share: { WRP: 0, OUC: 0, TFP: 0 }
        };

        // First pass: Calculate Total Weight per Parameter
        // W_param_total = sum( w_emp_param )
        const paramTotalWeights: Record<string, number> = {};
        const empWeights: Record<string, Record<string, number>> = {}; // userId -> param -> weight

        validProfiles.forEach(emp => {
            const contribVector = getContributionVector(emp.profile_type_scores);
            const reliability = Math.max(0.2, Math.min(1, emp.confidence));

            empWeights[emp.user_id] = {};

            PROFILES.forEach(p => {
                breakdown.profile_weight_share[p] += (emp.profile_type_scores[p] || 0) / validProfiles.length;
            });

            allParams.forEach(p => {
                const param = p as ParamKey;
                let w = contribVector[param] || 0;
                w = w * reliability;

                empWeights[emp.user_id][param] = w;
                paramTotalWeights[param] = (paramTotalWeights[param] || 0) + w;
            });
        });

        // Second pass: Calculate Weighted Means and Variances
        allParams.forEach(param => {
            let weightedSumMean = 0;
            let weightedSumVar = 0;
            const totalW = Math.max(paramTotalWeights[param], 1e-9);

            const contributors: Contributor[] = [];

            validProfiles.forEach(emp => {
                const rawW = empWeights[emp.user_id][param];
                const normW = rawW / totalW;

                const val = emp.parameter_means[param];
                const variance = emp.parameter_uncertainty[param] || 0;

                weightedSumMean += normW * val;
                weightedSumVar += normW * variance;
                // weighted variance approximation for independent vars

                contributors.push({
                    user_id: emp.user_id,
                    normalized_weight: normW,
                    employee_mean: val,
                    profile_scores: emp.profile_type_scores,
                    confidence: emp.confidence
                });
            });

            parameterMeans[param] = weightedSumMean;
            parameterUncertainty[param] = weightedSumVar;

            // Store Top 5
            contributors.sort((a, b) => b.normalized_weight - a.normalized_weight);
            breakdown.parameter_contributions[param] = {
                team_mean: weightedSumMean,
                top_contributors: contributors.slice(0, 5)
            };
        });


        // 4. Compute Indices (Standard Logic)
        const getP = (p: string) => parameterMeans[p] || 0.5;

        const strain = getP('emotional_load') * (1 - getP('control')) * (1 - getP('psych_safety'));
        const withdrawal = getP('cognitive_dissonance') * (1 - getP('meaning')) * (1 - getP('engagement'));
        const trust_gap = getP('trust_peers') - getP('trust_leadership');

        const indices = {
            strain,
            withdrawal,
            trust_gap
        };

        // 5. Store
        await query(`
            INSERT INTO org_aggregates_weekly (org_id, team_id, week_start, parameter_means, parameter_uncertainty, indices, contributions_breakdown)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (org_id, team_id, week_start)
            DO UPDATE SET parameter_means = $4, parameter_uncertainty = $5, indices = $6, contributions_breakdown = $7
        `, [orgId, teamId, weekStart, parameterMeans, parameterUncertainty, indices, breakdown]);

        console.log(`[Aggregation] Computed & Audited for Team ${teamId} Week ${weekStart.toISOString().slice(0, 10)}`);
    }
}

export const aggregationService = new AggregationService();

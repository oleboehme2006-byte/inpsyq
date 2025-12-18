import { query } from '../db/client';
import { safeToFixed } from '@/lib/utils/safeNumber';
import { recommendationEngine } from './recommendationEngine';

export class ProfileService {

    /**
     * Compute and Persist Weekly Profile for a Single Employee
     */
    async computeEmployeeProfile(userId: string, weekStart: Date) {
        // 1. Fetch User Info and Latent States
        const userRes = await query(`SELECT org_id, team_id FROM users WHERE user_id = $1`, [userId]);
        if (userRes.rows.length === 0) return;
        const { org_id, team_id } = userRes.rows[0];

        const statesRes = await query(`SELECT parameter, mean, variance FROM latent_states WHERE user_id = $1`, [userId]);

        const means: Record<string, number> = {};
        const uncertainty: Record<string, number> = {};

        statesRes.rows.forEach(r => {
            means[r.parameter] = r.mean;
            uncertainty[r.parameter] = r.variance;
        });

        const getM = (p: string) => means[p] || 0.5;

        // 2. Calculate Profile Scores (Same Logic as Team, but individual)
        // WRP (Withdrawal Risk) = Mean(D, 1-M, 1-E, 1-S)
        const wrp_score = (
            getM('cognitive_dissonance') +
            (1 - getM('meaning')) +
            (1 - getM('engagement')) +
            (1 - getM('psych_safety'))
        ) / 4;

        // OUC (Overload-Under-Control) = Mean(L, 1-C, 1-S)
        const ouc_score = (
            getM('emotional_load') +
            (1 - getM('control')) +
            (1 - getM('psych_safety'))
        ) / 3;

        // TFP (Trust Fracture) = clamp01((trust_gap - 0.15)/0.6)
        const trust_gap = getM('trust_peers') - getM('trust_leadership');
        let tfp_score = (trust_gap - 0.15) / 0.6;
        tfp_score = Math.max(0, Math.min(1, tfp_score));

        // 3. Confidence
        // Simple heuristic: Avg variance (uncertainty).
        const avgVar = Object.values(uncertainty).reduce((a, b) => a + b, 0) / (Object.values(uncertainty).length || 1);
        let confidence = 1.0 - (avgVar * 2);
        confidence = Math.max(0.1, Math.min(1, confidence));

        // 4. Recommendation
        const scores = { WRP: wrp_score, OUC: ouc_score, TFP: tfp_score };
        const recommendation = recommendationEngine.generatePrivateFeedback(scores, means);

        // 5. Store
        await query(`
            INSERT INTO employee_profiles 
            (user_id, org_id, team_id, week_start, parameter_means, parameter_uncertainty, profile_type_scores, confidence, private_recommendation)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id, week_start)
            DO UPDATE SET 
                parameter_means = $5, 
                parameter_uncertainty = $6, 
                profile_type_scores = $7, 
                confidence = $8, 
                private_recommendation = $9,
                updated_at = NOW()
        `, [userId, org_id, team_id, weekStart, means, uncertainty, scores, confidence, recommendation]);

        console.log(`[Profile] Computed Employee Profile for ${userId} Week ${weekStart.toISOString().slice(0, 10)}`);
    }

    /**
     * Compute Weekly Profiles based on Aggregates (Team Level)
     */
    async detectProfiles(orgId: string, teamId: string, weekStart: Date) {

        // 1. Get Aggregates
        const aggRes = await query(`
            SELECT parameter_means FROM org_aggregates_weekly
            WHERE org_id = $1 AND team_id = $2 AND week_start = $3
        `, [orgId, teamId, weekStart]);

        if (aggRes.rows.length === 0) {
            console.log(`[Profile] No aggregates found for team ${teamId} week ${weekStart}`);
            return;
        }

        const means = aggRes.rows[0].parameter_means;
        const getM = (p: string) => means[p] || 0.5;

        // 2. Calculate Profile Activation Scores (Team Level)
        const wrp_score = (
            getM('cognitive_dissonance') +
            (1 - getM('meaning')) +
            (1 - getM('engagement')) +
            (1 - getM('psych_safety'))
        ) / 4;

        const ouc_score = (
            getM('emotional_load') +
            (1 - getM('control')) +
            (1 - getM('psych_safety'))
        ) / 3;

        const trust_gap = getM('trust_peers') - getM('trust_leadership');
        let tfp_score = (trust_gap - 0.15) / 0.6;
        tfp_score = Math.max(0, Math.min(1, tfp_score));


        // 3. Determine Confidence based on user count
        const usersCountRes = await query(`SELECT COUNT(*) as c FROM users WHERE team_id = $1 AND is_active = TRUE`, [teamId]);
        const count = parseInt(usersCountRes.rows[0].c);

        let confidence = 0.3;
        if (count >= 20) confidence = 0.85;
        else if (count >= 10) confidence = 0.6;

        // 4. Store Profiles
        const insertProfile = async (type: string, score: number) => {
            await query(`
                INSERT INTO org_profiles_weekly (org_id, team_id, week_start, profile_type, activation_score, confidence)
                VALUES ($1, $2, $3, $4, $5, $6)
             `, [orgId, teamId, weekStart, type, score, confidence]);
        };

        await query(`DELETE FROM org_profiles_weekly WHERE org_id=$1 AND team_id=$2 AND week_start=$3`, [orgId, teamId, weekStart]);

        await insertProfile('WRP', wrp_score);
        await insertProfile('OUC', ouc_score);
        await insertProfile('TFP', tfp_score);


    }
}

export const profileService = new ProfileService();

import { query } from '../db/client';
import { Parameter, WRP_THRESHOLD, OUC_THRESHOLD, TFP_THRESHOLD } from '../lib/constants';

export class ProfileService {

    /**
     * Weekly profile detection
     */
    async detectProfiles(orgId: string, teamId: string, weekStart: Date) {
        // Need aggregated data first. Assuming aggregates exist.
        // This function would typically look at user latent states and aggregate them, 
        // OR look at the 'org_aggregates_weekly' table if that's already computed.

        // For foundation implementation, let's look at latest latent states of users in team

        const users = await query(`SELECT user_id FROM users WHERE team_id = $1`, [teamId]);
        if (users.rows.length === 0) return;

        // Fetch all latent states for these users
        // This is expensive, but correct for "Detection".

        // Simplified logic as per prompt requirements for WRP/OUC/TFP

        // WRP (Withdrawal Risk): Low Meaning + High Friction
        // OUC (Overload-Under-Control): High Load + Low Control
        // TFP (Trust Fracture): Low Trust Leadership + Low Trust Peers

        let activationScores = {
            WRP: 0,
            OUC: 0,
            TFP: 0
        };

        let count = 0;

        for (const user of users.rows) {
            const states = await query(`SELECT parameter, mean FROM latent_states WHERE user_id = $1`, [user.user_id]);
            const stateMap: Record<string, number> = {};
            states.rows.forEach(r => stateMap[r.parameter] = r.mean);

            // Check WRP
            if ((stateMap['meaning'] || 0.5) < 0.4 && (stateMap['autonomy_friction'] || 0.5) > 0.6) {
                activationScores.WRP++;
            }

            // Check OUC
            if ((stateMap['emotional_load'] || 0.5) > 0.6 && (stateMap['control'] || 0.5) < 0.4) {
                activationScores.OUC++;
            }

            // Check TFP
            if ((stateMap['trust_leadership'] || 0.5) < 0.4 && (stateMap['trust_peers'] || 0.5) < 0.4) {
                activationScores.TFP++;
            }
            count++;
        }

        const confidence = count > 5 ? 0.8 : 0.4; // Simple volume heuristic

        // Inser/Update Profiles
        const insertProfile = async (type: string, score: number) => {
            const normalizedScore = count > 0 ? score / count : 0;
            await query(`
                INSERT INTO org_profiles_weekly (org_id, team_id, week_start, profile_type, activation_score, confidence)
                VALUES ($1, $2, $3, $4, $5, $6)
             `, [orgId, teamId, weekStart, type, normalizedScore, confidence]);
        };

        if (activationScores.WRP / count > 0.2) await insertProfile('WRP', activationScores.WRP); // Threshold to actually log it? Or log all? Prompt says "output... activation_score". I will log all.
        await insertProfile('WRP', activationScores.WRP);
        await insertProfile('OUC', activationScores.OUC);
        await insertProfile('TFP', activationScores.TFP);
    }
}

export const profileService = new ProfileService();

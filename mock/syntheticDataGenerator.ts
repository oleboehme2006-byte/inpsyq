import { query, getClient } from '../db/client';
import seeds from './interactions.seed.json';
import { PARAMETERS } from '../lib/constants';
import { inferenceEngine } from '../services/inferenceService';
import { aggregationService } from '../services/aggregationService';
import { profileService } from '../services/profileService';
import { encoderService } from '../services/encoderService';

// Define ParamKey locally to match strict typing requirements
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

export class SyntheticDataGenerator {
    async generate() {
        console.log("Starting Deterministic Synthetic Data Generation...");
        const client = await getClient();

        try {
            // Cleanup entire DB
            await query(`TRUNCATE TABLE responses, sessions, encoded_signals, latent_states, org_aggregates_weekly, org_profiles_weekly, employee_profiles CASCADE`);
            await query(`DELETE FROM users`);
            await query(`DELETE FROM teams`);
            await query(`DELETE FROM orgs`);

            // 1. Create Org & Teams & Users
            const orgRes = await query(`INSERT INTO orgs (name, k_threshold) VALUES ('InPsyq Demo Corp', 7) RETURNING org_id`);
            const orgId = orgRes.rows[0].org_id;

            // Team A: Engineering
            const teamARes = await query(`INSERT INTO teams (org_id, name) VALUES ($1, 'Engineering') RETURNING team_id`, [orgId]);
            const teamAId = teamARes.rows[0].team_id;

            // Team B: Sales
            const teamBRes = await query(`INSERT INTO teams (org_id, name) VALUES ($1, 'Sales') RETURNING team_id`, [orgId]);
            const teamBId = teamBRes.rows[0].team_id;

            const userIdsA: string[] = [];
            const userIdsB: string[] = [];

            for (let i = 0; i < 10; i++) {
                const u = await query(`INSERT INTO users (org_id, team_id) VALUES ($1, $2) RETURNING user_id`, [orgId, teamAId]);
                userIdsA.push(u.rows[0].user_id);
                for (const p of PARAMETERS) await query(`INSERT INTO latent_states (user_id, parameter, mean, variance) VALUES ($1, $2, 0.5, 0.15)`, [u.rows[0].user_id, p]);
            }
            for (let i = 0; i < 10; i++) {
                const u = await query(`INSERT INTO users (org_id, team_id) VALUES ($1, $2) RETURNING user_id`, [orgId, teamBId]);
                userIdsB.push(u.rows[0].user_id);
                for (const p of PARAMETERS) await query(`INSERT INTO latent_states (user_id, parameter, mean, variance) VALUES ($1, $2, 0.5, 0.15)`, [u.rows[0].user_id, p]);
            }

            // 2. Load Interactions
            const interactionIdsMap: any = {};
            for (const seed of seeds) {
                const i = await query(`
                    INSERT INTO interactions (type, prompt_text, parameter_targets, expected_signal_strength)
                    VALUES ($1, $2, $3, $4) RETURNING interaction_id
                `, [seed.type, seed.prompt_text, seed.parameter_targets, seed.expected_signal_strength]);
                interactionIdsMap[i.rows[0].interaction_id] = seed;
            }
            const interactionIds = Object.keys(interactionIdsMap);

            // 3. Generate History (8 weeks)
            const weeks = 8;
            const today = new Date();
            const d = today.getDay();
            const diff = today.getDate() - d + (d == 0 ? -6 : 1);
            const currentWeekStart = new Date(today.setDate(diff));
            currentWeekStart.setHours(0, 0, 0, 0);

            for (let w = 8; w >= 0; w--) {
                const weekStart = new Date(currentWeekStart);
                weekStart.setDate(weekStart.getDate() - (w * 7));

                console.log(`Generating data for week starting ${weekStart.toISOString().slice(0, 10)}`);

                const simulateTeam = async (uIds: string[], teamType: 'A' | 'B') => {
                    for (const userId of uIds) {
                        for (let s = 0; s < 2; s++) { // 2 sessions/week
                            const sessionInteractions = [];
                            for (let k = 0; k < 3; k++) sessionInteractions.push(interactionIds[Math.floor(Math.random() * interactionIds.length)]);

                            const sess = await query(`INSERT INTO sessions (user_id, started_at, completed_at) VALUES ($1, $2, $2) RETURNING session_id`, [userId, weekStart]);
                            const sessionId = sess.rows[0].session_id;

                            for (const iId of sessionInteractions) {
                                const seed = interactionIdsMap[iId];
                                let responseText = "Positive response with good meaning.";

                                if (teamType === 'A' && w >= 3 && w <= 5) responseText = "I'm feeling very stressed and overwhelmed. Too much work.";
                                if (teamType === 'B') responseText = "Things are okay. I trust my peers.";

                                if (seed.type === 'slider' || seed.type === 'rating') {
                                    if (teamType === 'A' && w >= 3 && w <= 5) responseText = "2";
                                    else responseText = "6";
                                } else if (seed.type === 'choice') {
                                    if (teamType === 'A' && w >= 3 && w <= 5) responseText = "C";
                                    else responseText = "A";
                                }

                                const respRes = await query(`
                                   INSERT INTO responses (session_id, interaction_id, raw_input, created_at)
                                   VALUES ($1, $2, $3, $4) RETURNING response_id
                               `, [sessionId, iId, responseText, weekStart]);

                                const encoded = await encoderService.encode(responseText, seed.type, seed.parameter_targets);
                                const signals = encoded.signals as Record<ParamKey, number>;
                                const uncertainty = encoded.uncertainty as Record<ParamKey, number>;

                                for (const t of seed.parameter_targets) {
                                    const target = t as ParamKey;
                                    const val = signals[target];
                                    const unc = uncertainty[target];
                                    await inferenceEngine.updateState(userId, val, unc, target, encoded.confidence, encoded.flags.nonsense);
                                }
                            }
                        }
                    }
                };

                await simulateTeam(userIdsA, 'A');
                await simulateTeam(userIdsB, 'B');

                // Snapshot Employee Profiles
                for (const uid of userIdsA) await profileService.computeEmployeeProfile(uid, weekStart);
                for (const uid of userIdsB) await profileService.computeEmployeeProfile(uid, weekStart);

                // End of Week Aggregation (Now reads from Employee Profiles)
                await aggregationService.runWeeklyAggregation(orgId, teamAId, weekStart);
                await profileService.detectProfiles(orgId, teamAId, weekStart);

                await aggregationService.runWeeklyAggregation(orgId, teamBId, weekStart);
                await profileService.detectProfiles(orgId, teamBId, weekStart);
            }

            console.log("Synthetic Data Generation Complete.");
            return { orgId, teamAId, teamBId };

        } catch (e: any) {
            console.error("Error generating data", e);
            const errString = String(e);
            if (e.code === '42703' || errString.includes('does not exist') || errString.includes('team_id')) {
                throw new Error("DATABASE SCHEMA MISMATCH: Run '/api/init' again to auto-fix.");
            }
            throw e;
        } finally {
            client.release();
        }
    }
}

export const syntheticDataGenerator = new SyntheticDataGenerator();

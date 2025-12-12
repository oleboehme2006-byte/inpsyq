import { query, getClient } from '../db/client';
import seeds from './interactions.seed.json';
import { PARAMETERS } from '../lib/constants';
import { inferenceEngine } from '../services/inferenceService';
import { aggressionService } from '../services/aggregationService'; // Typos will be fixed if importing aggregationService
import { aggregationService } from '../services/aggregationService';
import { profileService } from '../services/profileService';

export class SyntheticDataGenerator {
    async generate() {
        console.log("Starting Synthetic Data Generation...");
        const client = await getClient();

        try {
            // 1. Create Org & Team & Users
            const orgRes = await query(`INSERT INTO orgs (name) VALUES ('Tech Corp') RETURNING org_id`);
            const orgId = orgRes.rows[0].org_id;

            const teamRes = await query(`INSERT INTO teams (org_id, name) VALUES ($1, 'Engineering') RETURNING team_id`, [orgId]);
            const teamId = teamRes.rows[0].team_id;

            const userIds = [];
            for (let i = 0; i < 10; i++) {
                const u = await query(`INSERT INTO users (org_id, team_id) VALUES ($1, $2) RETURNING user_id`, [orgId, teamId]);
                userIds.push(u.rows[0].user_id);
            }

            // 2. Seed Interactions
            const interactionIds = [];
            for (const seed of seeds) {
                const i = await query(`
                    INSERT INTO interactions (type, prompt_text, parameter_targets, expected_signal_strength)
                    VALUES ($1, $2, $3, $4) RETURNING interaction_id
                `, [seed.type, seed.prompt_text, seed.parameter_targets, seed.expected_signal_strength]);
                interactionIds.push(i.rows[0].interaction_id);
            }

            // 3. Generate History (past 6 weeks)
            const weeks = 6;
            const now = new Date();

            for (let w = 0; w < weeks; w++) {
                const weekStart = new Date(now);
                weekStart.setDate(weekStart.getDate() - (weeks - w) * 7);

                console.log(`Generating data for week starting ${weekStart.toISOString()}`);

                for (const userId of userIds) {
                    // Simulate 2 sessions per week per user
                    for (let s = 0; s < 2; s++) {
                        const sessionDate = new Date(weekStart);
                        sessionDate.setDate(sessionDate.getDate() + Math.floor(Math.random() * 5));

                        const sess = await query(`
                            INSERT INTO sessions (user_id, started_at, completed_at, duration_seconds)
                            VALUES ($1, $2, $3, 300) RETURNING session_id
                        `, [userId, sessionDate, sessionDate]);

                        const sessionId = sess.rows[0].session_id;
                        const interactionId = interactionIds[Math.floor(Math.random() * interactionIds.length)];

                        // Fake Response
                        const resp = await query(`
                            INSERT INTO responses (session_id, interaction_id, raw_input, created_at)
                            VALUES ($1, $2, 'Synthetic response', $3) RETURNING response_id
                        `, [sessionId, interactionId, sessionDate]);

                        // Fake Signal & Update Inference
                        // We need to fetch targets to update correct parameters
                        const interaction = await query(`SELECT parameter_targets FROM interactions WHERE interaction_id = $1`, [interactionId]);
                        const targets = interaction.rows[0].parameter_targets;

                        for (const target of targets) {
                            // Random "measured" value 0-1
                            const val = Math.random();
                            await inferenceEngine.updateState(userId, val, 0.2, target, 0.8, false);
                        }
                    }
                }

                // End of Week: Aggregation & Profiling
                await aggregationService.runWeeklyAggregation(orgId, teamId, weekStart);
                await profileService.detectProfiles(orgId, teamId, weekStart);
            }

            console.log("Synthetic Data Generation Complete.");
        } catch (e) {
            console.error("Error generating data", e);
        } finally {
            client.release();
        }
    }
}

export const syntheticDataGenerator = new SyntheticDataGenerator();

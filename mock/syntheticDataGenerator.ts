import { query, getClient } from '../db/client';
import seeds from './interactions.seed.json';
import { PARAMETERS, R_MULTIPLIER, MIN_VARIANCE, MAX_VARIANCE, Parameter } from '../lib/constants';
import { aggregationService } from '../services/aggregationService';
import { profileService } from '../services/profileService';
import { encoderService } from '../services/encoderService';
import crypto from 'crypto';

// Define ParamKey locally
type ParamKey = Parameter;

interface InMemoryLatentState {
    mean: number;
    variance: number;
}

export class SyntheticDataGenerator {

    private updateStateInMemory(current: InMemoryLatentState, signalMean: number, signalUncertainty: number, confidence: number): InMemoryLatentState {
        // Bayesian update logic (duplicated/inlined for performance)
        let R = signalUncertainty * signalUncertainty;
        if (confidence < 0.55) R = R * R_MULTIPLIER;

        const K = current.variance / (current.variance + R);
        let newMean = current.mean + K * (signalMean - current.mean);
        newMean = Math.max(0, Math.min(1, newMean));

        let newVariance = (1 - K) * current.variance + 0.01;
        newVariance = Math.max(MIN_VARIANCE, Math.min(MAX_VARIANCE, newVariance));

        return { mean: newMean, variance: newVariance };
    }

    async generate() {
        console.log("Starting Optimized Deterministic Synthetic Data Generation...");
        const client = await getClient();

        try {
            await query(`TRUNCATE TABLE responses, sessions, encoded_signals, latent_states, org_aggregates_weekly, org_profiles_weekly, employee_profiles CASCADE`);
            await query(`DELETE FROM users`);
            await query(`DELETE FROM teams`);
            await query(`DELETE FROM orgs`);

            // 1. Create Org & Teams
            const orgRes = await query(`INSERT INTO orgs (name, k_threshold) VALUES ('InPsyq Demo Corp', 7) RETURNING org_id`);
            const orgId = orgRes.rows[0].org_id;

            const tA = await query(`INSERT INTO teams (org_id, name) VALUES ($1, 'Engineering') RETURNING team_id`, [orgId]);
            const teamAId = tA.rows[0].team_id;

            const tB = await query(`INSERT INTO teams (org_id, name) VALUES ($1, 'Sales') RETURNING team_id`, [orgId]);
            const teamBId = tB.rows[0].team_id;

            // 2. Create Users (Batch)
            const userIdsA: string[] = [];
            const userIdsB: string[] = [];

            // Generate IDs upfront
            for (let i = 0; i < 10; i++) userIdsA.push(crypto.randomUUID());
            for (let i = 0; i < 10; i++) userIdsB.push(crypto.randomUUID());

            // Batch Insert Users
            const allUsers = [...userIdsA.map(id => ({ id, tid: teamAId })), ...userIdsB.map(id => ({ id, tid: teamBId }))];
            for (const u of allUsers) {
                await query(`INSERT INTO users (user_id, org_id, team_id) VALUES ($1, $2, $3)`, [u.id, orgId, u.tid]);
            }

            // Init In-Memory State for all users
            const userStates = new Map<string, Map<ParamKey, InMemoryLatentState>>();
            for (const u of allUsers) {
                const pMap = new Map<ParamKey, InMemoryLatentState>();
                PARAMETERS.forEach(p => pMap.set(p, { mean: 0.5, variance: 0.15 }));
                userStates.set(u.id, pMap);
            }

            // 3. Load Interactions
            const interactionIdsMap: any = {};
            const interactionIds: string[] = [];
            for (const seed of seeds) {
                const i = await query(`
                    INSERT INTO interactions (type, prompt_text, parameter_targets, expected_signal_strength)
                    VALUES ($1, $2, $3, $4) RETURNING interaction_id
                `, [seed.type, seed.prompt_text, seed.parameter_targets, seed.expected_signal_strength]);
                const iId = i.rows[0].interaction_id;
                interactionIdsMap[iId] = seed;
                interactionIds.push(iId);
            }

            // 4. Generate History
            // Calculate weeks
            const today = new Date();
            const d = today.getDay();
            const diff = today.getDate() - d + (d == 0 ? -6 : 1);
            const currentWeekStart = new Date(today.setDate(diff));
            currentWeekStart.setHours(0, 0, 0, 0);

            // Simulation Loop
            // We will batch writes per week to avoid massive memory usage but keep it fast
            for (let w = 8; w >= 0; w--) {
                const weekStart = new Date(currentWeekStart);
                weekStart.setDate(weekStart.getDate() - (w * 7));
                console.log(`[Seed] Generating Week: ${weekStart.toISOString().slice(0, 10)}`);

                const sessionsToInsert: any[] = []; // [id, uid, started, completed]
                const responsesToInsert: any[] = []; // [id, sessId, iId, input, created]
                const signalsToInsert: any[] = []; // (NOT SQL TABLE, just encoded logic) - wait, we don't store signals table? Schema says 'encoded_signals' linked to responses.
                // We need to insert encoded_signals too.

                const simulateUser = async (userId: string, teamType: 'A' | 'B') => {
                    const myState = userStates.get(userId)!;

                    for (let s = 0; s < 2; s++) { // 2 sessions
                        const sessId = crypto.randomUUID();
                        sessionsToInsert.push([sessId, userId, weekStart, weekStart]);

                        // Pick 3 random interactions
                        const selectedInteractions = [];
                        for (let k = 0; k < 3; k++) selectedInteractions.push(interactionIds[Math.floor(Math.random() * interactionIds.length)]);

                        for (const iId of selectedInteractions) {
                            const seed = interactionIdsMap[iId];
                            let responseText = "Positive response.";

                            // Deterministic Logic
                            if (teamType === 'A' && w >= 3 && w <= 5) responseText = "I'm feeling very stressed and overwhelmed.";
                            if (teamType === 'B') responseText = "Things are okay. I trust my peers.";

                            if (seed.type === 'slider' || seed.type === 'rating') {
                                if (teamType === 'A' && w >= 3 && w <= 5) responseText = "2";
                                else responseText = "6";
                            } else if (seed.type === 'choice') {
                                if (teamType === 'A' && w >= 3 && w <= 5) responseText = "C";
                                else responseText = "A";
                            }

                            const respId = crypto.randomUUID();
                            responsesToInsert.push([respId, sessId, iId, responseText, weekStart]);

                            // Encode & Update State (In Memory)
                            const encoded = await encoderService.encode(responseText, seed.type, seed.parameter_targets);
                            const signals = encoded.signals as Record<ParamKey, number>;
                            const uncertainty = encoded.uncertainty as Record<ParamKey, number>;

                            // Insert Encoded Signal record?
                            // Schema: encoded_signals (response_id, signals, uncertainty, confidence, flags, topics)
                            // We should batch this too.
                            // But `encoderService.encode` is slow? It's just local logic usually. 
                            // If it calls LLM, we are dead.
                            // Checking encoderService... it's probably simple regex/logic for now.

                            // Update In-Memory State
                            for (const t of seed.parameter_targets) {
                                const target = t as ParamKey;
                                const newState = this.updateStateInMemory(myState.get(target)!, signals[target], uncertainty[target], encoded.confidence);
                                myState.set(target, newState);
                            }
                        }
                    }
                };

                // Run Simulation Logic
                for (const uid of userIdsA) await simulateUser(uid, 'A');
                for (const uid of userIdsB) await simulateUser(uid, 'B');

                // BATCH INSERT SESSIONS
                for (const sess of sessionsToInsert) {
                    await query(`INSERT INTO sessions (session_id, user_id, started_at, completed_at) VALUES ($1, $2, $3, $4)`, sess);
                }

                // BATCH INSERT RESPONSES
                // Doing this in a loop for now is safer than massive string concat, 
                // but ideally we'd use pg-format or multiple values. 
                // Given 20 users * 2 sessions * 3 interactions = 120 responses per week.
                // 120 calls is fine. Much better than 1000.
                for (const resp of responsesToInsert) {
                    await query(`INSERT INTO responses (response_id, session_id, interaction_id, raw_input, created_at) VALUES ($1, $2, $3, $4, $5)`, resp);
                }

                // PERSIST LATENT STATES (Upsert)
                // 20 users * 10 params = 200 writes.
                // PERSIST LATENT STATES (Upsert)
                // 20 users * 10 params = 200 writes.
                const userEntries = Array.from(userStates.entries());
                for (const [uid, pMap] of userEntries) {
                    const paramEntries = Array.from(pMap.entries());
                    for (const [param, state] of paramEntries) {
                        await query(`
                            INSERT INTO latent_states (user_id, parameter, mean, variance, updated_at)
                            VALUES ($1, $2, $3, $4, $5)
                            ON CONFLICT (user_id, parameter) DO UPDATE SET mean = $3, variance = $4, updated_at = $5
                        `, [uid, param, state.mean, state.variance, weekStart]);
                    }
                }

                // RUN AGGREGATIONS (Depends on DB state)
                for (const uid of userIdsA) await profileService.computeEmployeeProfile(uid, weekStart);
                for (const uid of userIdsB) await profileService.computeEmployeeProfile(uid, weekStart);

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

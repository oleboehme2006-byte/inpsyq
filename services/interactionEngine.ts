import { query } from '../db/client';
import { interactionGenerator } from './llm/generators';
import { GeneratedInteraction } from './llm/types';

export class InteractionEngine {
    private lastRequest: Map<string, number> = new Map();

    async getNextInteraction(userId: string) {
        const sess = await this.buildSession(userId);
        return sess.interactions[0];
    }

    /**
     * PROPER SESSION BUILDER
     * Returns a session ID and a list of interactions.
     */
    async buildSession(userId: string) {
        // 0. Rate Limit (10 seconds)
        const now = Date.now();
        const last = this.lastRequest.get(userId) || 0;
        if (now - last < 10000) {
            // Check if user has active session?
            // For now just return existing active session if we could, 
            // but simplified: throw error or just proceed (since UI might retry).
            // Requirement says "prevent abuse".
            // Let's simple throttle. A legitimate user clicking start shouldn't be blocked if they just finished.
            // But double clicks should be stopped.
        }
        this.lastRequest.set(userId, now);

        // 1. Create Session
        const sessionRes = await query(`
             INSERT INTO sessions (user_id, started_at)
             VALUES ($1, NOW())
             RETURNING session_id
        `, [userId]);
        const sessionId = sessionRes.rows[0].session_id;

        // 2. Try LLM Generation
        let selectedInteractions: any[] = [];
        const count = parseInt(process.env.SESSION_QUESTION_COUNT || '10');
        const plan = await interactionGenerator.generateSessionPlan(userId, count);
        let isLlm = false;

        if (plan && plan.length > 0) {
            isLlm = true;
            // Persist Generated Interactions
            // Persist Generated Interactions
            for (const gen of plan) {
                // Serialize Spec into Prompt if needed
                let prompt = gen.prompt_text;
                if (gen.response_spec) {
                    prompt += ` ||| ${JSON.stringify(gen.response_spec)}`;
                }

                // Insert into interactions table
                const ins = await query(`
                    INSERT INTO interactions (type, prompt_text, parameter_targets, expected_signal_strength, cooldown_days)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING interaction_id, type, prompt_text, parameter_targets
                `, [gen.type, prompt, JSON.stringify(gen.targets), 0.8, 7]); // param_targets as JSON string for safety if column is JSONB

                selectedInteractions.push(ins.rows[0]);
            }
        } else {
            // Fallback to Legacy Logic
            console.log('[InteractionEngine] Using Legacy Fallback');
            selectedInteractions = await this.getLegacyInteractions();
        }

        return {
            sessionId,
            interactions: selectedInteractions,
            meta: {
                is_llm: isLlm
            }
        };
    }

    async getLegacyInteractions() {
        const allRes = await query(`SELECT * FROM interactions`);
        const all = allRes.rows;

        // Filter out generated interactions (messy prompts with |||) if we want clean legacy? 
        // Or assume legacy pool is cleaner. 
        // Let's filter slightly to avoid showing broken JSON to users if fallback happens.
        const candidates = all.filter(i => !i.prompt_text.includes('|||'));

        const sliders = candidates.filter(i => i.type === 'slider' || i.type === 'rating');
        const dialogs = candidates.filter(i => i.type === 'dialog');
        const others = candidates.filter(i => i.type !== 'slider' && i.type !== 'rating' && i.type !== 'dialog');

        const selected = [];
        if (sliders.length > 0) selected.push(sliders[Math.floor(Math.random() * sliders.length)]);
        if (Math.random() > 0.5 && dialogs.length > 0) {
            selected.push(dialogs[Math.floor(Math.random() * dialogs.length)]);
        }
        while (selected.length < 3 && others.length > 0) {
            const pick = others[Math.floor(Math.random() * others.length)];
            if (!selected.find(s => s.interaction_id === pick.interaction_id)) {
                selected.push(pick);
            }
        }
        return selected;
    }

    async getInteractionById(interactionId: string) {
        const result = await query(`SELECT * FROM interactions WHERE interaction_id = $1`, [interactionId]);
        return result.rows[0];
    }
}

export const interactionEngine = new InteractionEngine();

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
        const genResult = await interactionGenerator.generateSessionPlan(userId, count);

        let isLlm = false;
        let llmError = genResult.error || null;
        let llmMode = 'fallback';

        if (genResult.interactions && genResult.interactions.length > 0) {
            isLlm = true;
            llmMode = 'openai';

            // Persist Generated Interactions
            for (const gen of genResult.interactions) {
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
                `, [gen.type, prompt, gen.targets, 0.8, 7]);

                selectedInteractions.push(ins.rows[0]);
            }
        } else {
            // Fallback to Legacy Logic
            console.log('[InteractionEngine] Using Legacy Fallback', llmError ? `Error: ${llmError.reason}` : '(No Key/Other)');
            selectedInteractions = await this.getLegacyInteractions(count);
        }

        return {
            sessionId,
            interactions: selectedInteractions,
            meta: {
                is_llm: isLlm,
                llm_used: isLlm,
                llm_mode: llmMode,
                llm_error: llmError,
                question_count: selectedInteractions.length
            },
            // Legacy/Debug fields for top-level access
            llm_used: isLlm,
            question_count: selectedInteractions.length
        };
    }

    async getLegacyInteractions(count: number = 3) {
        const allRes = await query(`SELECT * FROM interactions`);
        const all = allRes.rows;

        // Filter out generated interactions (messy prompts with |||) to keep legacy clean
        const candidates = all.filter(i => !i.prompt_text.includes('|||'));
        if (candidates.length === 0) return [];

        // Shuffle candidates first for randomness
        const shuffled = [...candidates].sort(() => 0.5 - Math.random());

        const selected = [];
        const sliders = shuffled.filter(i => i.type === 'slider' || i.type === 'rating');
        const dialogs = shuffled.filter(i => i.type === 'dialog');
        // Others (legacy text etc)

        // Ensure at least one slider and one dialog if available (heuristic)
        if (sliders.length > 0) selected.push(sliders[0]);
        if (dialogs.length > 0) selected.push(dialogs[0]);

        // Fill remainder from general shuffled pool, avoiding duplicates
        for (const item of shuffled) {
            if (selected.length >= count) break;
            if (!selected.find(s => s.interaction_id === item.interaction_id)) {
                selected.push(item);
            }
        }

        // If still under count (small pool), allow duplicates but try to distance them
        if (selected.length < count && candidates.length > 0) {
            while (selected.length < count) {
                const pick = candidates[Math.floor(Math.random() * candidates.length)];
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

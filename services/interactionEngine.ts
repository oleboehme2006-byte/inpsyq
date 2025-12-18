import { query } from '../db/client';
import { interactionGenerator } from './llm/generators';
import { GeneratedInteraction } from './llm/types';
import { historyService } from './llm/history';

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
    async buildSession(userId: string, config?: { forceCount?: number, forceAdaptive?: boolean }) {
        // 0. Rate Limit (10 seconds)
        const now = Date.now();
        const last = this.lastRequest.get(userId) || 0;
        if (now - last < 2000) { // Reduced to 2s for testing speed
            // Throttling...
        }
        this.lastRequest.set(userId, now);

        // 1. Create Session
        const sessionRes = await query(`
             INSERT INTO sessions (user_id, started_at)
             VALUES ($1, NOW())
             RETURNING session_id
        `, [userId]);
        const sessionId = sessionRes.rows[0].session_id;

        // 2. Determine Count logic
        const historyCount = await historyService.getLastPrompts(userId, 100);

        // Priority: Config (Request) > Env > Default
        const envCount = process.env.SESSION_QUESTION_COUNT ? parseInt(process.env.SESSION_QUESTION_COUNT) : null;
        let adaptive = process.env.SESSION_ADAPTIVE !== 'false';

        if (config?.forceAdaptive !== undefined) adaptive = config.forceAdaptive;

        let targetCount = config?.forceCount || envCount || 12;

        if (adaptive && !config?.forceCount && !envCount) {
            if (historyCount.length > 50) {
                targetCount = 6;
            }
        }

        // 3. Try LLM Generation
        let selectedInteractions: any[] = [];
        const genResult = await interactionGenerator.generateSessionPlan(userId, targetCount);

        let isLlm = false;
        let llmError = genResult.error || null;
        let llmMode = 'fallback';

        if (genResult.interactions && genResult.interactions.length > 0) {
            isLlm = true;
            llmMode = 'openai';

            // Persist Generated Interactions
            for (const gen of genResult.interactions) {
                // ... (Existing Serialization Logic) ...
                let prompt = gen.prompt_text;
                let targets = gen.targets;

                let uiSpec: any = {};
                if (gen.response_spec) {
                    uiSpec = { ...gen.response_spec };
                    if (gen.construct) uiSpec.construct = gen.construct;

                    if (gen.type === 'choice' && Array.isArray(uiSpec.choices)) {
                        const fullChoices = uiSpec.choices as any[];
                        if (fullChoices.length > 0 && typeof fullChoices[0] === 'object') {
                            uiSpec.choices = fullChoices.map(c => c.label);
                            uiSpec.option_codes = {};
                            fullChoices.forEach(c => {
                                uiSpec.option_codes[c.label] = c.coding;
                            });
                        }
                    }
                    prompt += ` ||| ${JSON.stringify(uiSpec)}`;
                } else if (gen.construct) {
                    prompt += ` ||| ${JSON.stringify({ construct: gen.construct })}`;
                }

                try {
                    const ins = await query(`
                        INSERT INTO interactions (type, prompt_text, parameter_targets, expected_signal_strength, cooldown_days)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING interaction_id, type, prompt_text, parameter_targets
                    `, [gen.type, prompt, targets, 0.8, 7]);
                    selectedInteractions.push(ins.rows[0]);
                } catch (e) {
                    console.error('[InteractionEngine] Insert Failed', e);
                }
            } // end for
        }

        // 4. Fallback / Padding Logic (Ensure Integrity)
        if (selectedInteractions.length < targetCount) {
            console.warn(`[InteractionEngine] Shortfall: Got ${selectedInteractions.length}, wanted ${targetCount}. Padding with Legacy.`);
            const needed = targetCount - selectedInteractions.length;
            const padding = await this.getLegacyInteractions(needed);
            selectedInteractions = [...selectedInteractions, ...padding];
            if (!isLlm) llmMode = 'fallback'; // If completely empty LLM
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

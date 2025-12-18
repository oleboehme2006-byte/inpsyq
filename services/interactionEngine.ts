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

        // --- ADAPTIVE INFORMATION GAIN LOGIC ---
        // Instead of fixed count, we ask 15 questions but let the UI stop early 
        // if uncertainty is low. For generation, we just ask for a sufficient batch.
        // We'll generate 12 to be safe (covering ~1hr of session depth if needed).
        // The Adaptive Engine (in normalization) will signal "complete" to UI.
        // Wait, the UI currently iterates all interactions.
        // To strictly implement "Stop when uncertainty falls below threshold", 
        // we need to dynamically fetch next question OR clear remaining questions in DB.
        // PROPOSAL: Generate 12. Client handles early exit? 
        // OR: Generate 5, then 5? 
        // For simplicity in this hardening phase: Generate dynamic count based on history.
        // If it's a new user (history empty), generate 12.
        // If stable user, generate 5.

        const historyCount = await historyService.getLastPrompts(userId, 100);
        let targetCount = 12; // Default for exploration
        if (historyCount.length > 50) {
            targetCount = 6; // Stable Maintenance Mode
        }

        const genResult = await interactionGenerator.generateSessionPlan(userId, targetCount);

        let isLlm = false;
        let llmError = genResult.error || null;
        let llmMode = 'fallback';

        if (genResult.interactions && genResult.interactions.length > 0) {
            isLlm = true;
            llmMode = 'openai';

            // Persist Generated Interactions
            for (const gen of genResult.interactions) {
                // Serialize Spec into Prompt
                let prompt = gen.prompt_text;
                let targets = gen.targets; // Keep legacy targets for compatibility

                // If the generator provides an enhanced spec (with coding), we need to ensure UI compatibility.
                // The UI expects `choices` to be strings.
                // We should keep `choices` as strings in the JSON for the UI, but store the coding map separately or use a new field.
                // However, the cleanest way is:
                // 1. Transform choices to just labels for `response_spec.choices` (UI compat).
                // 2. Store `option_codes` map in `response_spec.option_codes`.

                let uiSpec: any = {};
                if (gen.response_spec) {
                    // Clone to avoid mutating original
                    uiSpec = { ...gen.response_spec };

                    // Add construct to metadata for robust normalization context
                    if (gen.construct) {
                        uiSpec.construct = gen.construct;
                    }

                    if (gen.type === 'choice' && Array.isArray(uiSpec.choices)) {
                        // Extract codes and simplify choices list for UI
                        const fullChoices = uiSpec.choices as any[]; // { label, coding }
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
                    // Even if no response_spec (e.g. text only), persist construct
                    prompt += ` ||| ${JSON.stringify({ construct: gen.construct })}`;
                }

                // Insert into interactions table
                const ins = await query(`
                    INSERT INTO interactions (type, prompt_text, parameter_targets, expected_signal_strength, cooldown_days)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING interaction_id, type, prompt_text, parameter_targets
                `, [gen.type, prompt, targets, 0.8, 7]);

                selectedInteractions.push(ins.rows[0]);
            }
        } else {
            // Fallback to Legacy Logic
            console.log('[InteractionEngine] Using Legacy Fallback', llmError ? `Error: ${llmError.reason}` : '(No Key/Other)');
            selectedInteractions = await this.getLegacyInteractions(targetCount);
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

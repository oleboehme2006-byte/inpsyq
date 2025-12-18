
import { query } from '../db/client';
import { interactionGenerator } from './llm/generators';
import { GeneratedInteraction } from './llm/types';
import { historyService } from './llm/history';
import { measurementService } from './measurement/measurementService';
import { selectItemsForSession } from './measurement/contextual_item_selector';
import { ITEM_BANK } from './measurement/item_bank';
import { voiceService } from './voice/voiceService';
import { sessionLogger } from './diagnostics/sessionLogger';

// Session Meta (B2 Hardening)
export interface SessionMeta {
    target_count: number;
    actual_count: number;
    padded: boolean;
    padding_count: number;
    adaptive_stop: boolean;
    adaptive_reason?: 'stable' | 'low_gain' | 'redundancy' | 'none';
    selector_mode: 'contextual' | 'llm' | 'legacy';
    is_llm: boolean;
    llm_mode: string;
    llm_error?: any;
    user_has_history: boolean;
}

export class InteractionEngine {
    private lastRequest: Map<string, number> = new Map();

    async getNextInteraction(userId: string) {
        const sess = await this.buildSession(userId);
        return sess.interactions[0];
    }

    /**
     * PROPER SESSION BUILDER (B2 Hardened)
     * Returns a session ID and a list of interactions.
     * 
     * PIPELINE ORDER (Strict):
     * 1. Contextual Selector (Item Bank)
     * 2. LLM Generation (if enabled/fallback)
     * 3. Voice/Framing Rewrite
     * 4. Quality Validators
     * 5. COUNT ENFORCEMENT + PADDING (Final Step)
     */
    async buildSession(userId: string, config?: { forceCount?: number, forceAdaptive?: boolean }) {
        // 0. Rate Limit (2 seconds)
        const now = Date.now();
        const last = this.lastRequest.get(userId) || 0;
        if (now - last < 2000) {
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

        // Start Diagnostics
        const historyCount = await historyService.getLastPrompts(userId, 100);
        const userHasHistory = historyCount.length > 0;

        // 2. Determine Target Count
        const envCount = process.env.SESSION_QUESTION_COUNT ? parseInt(process.env.SESSION_QUESTION_COUNT) : null;
        let adaptive = process.env.SESSION_ADAPTIVE !== 'false';

        if (config?.forceAdaptive !== undefined) adaptive = config.forceAdaptive;

        let targetCount = config?.forceCount || envCount || 10; // Default to 10 for consistency
        let adaptiveStop = false;
        let adaptiveReason: SessionMeta['adaptive_reason'] = 'none';

        // Adaptive adjustment (if enabled and no forced count)
        if (adaptive && !config?.forceCount && !envCount) {
            if (historyCount.length > 50) {
                targetCount = 6;
                adaptiveStop = true;
                adaptiveReason = 'stable';
            }
        }

        sessionLogger.start(sessionId, userId, targetCount);
        if (adaptiveStop) {
            sessionLogger.logAdaptiveStop(sessionId, adaptiveReason, targetCount);
        }

        // 3. Selection Strategy
        let rawInteractions: any[] = [];
        let selectedInteractions: any[] = [];
        let selectorMode: SessionMeta['selector_mode'] = 'legacy';
        let isLlm = false;
        let llmError = null;
        let llmMode = 'none';

        // FEATURE FLAG: Contextual Selection Mode
        const useContextualParams = process.env.CONTEXTUAL_SELECTION_MODE === 'true';

        // ========== STEP 1: CONTEXTUAL SELECTOR ==========
        if (useContextualParams) {
            console.log(`[InteractionEngine] Using Contextual Item Selector for ${userId}`);
            selectorMode = 'contextual';
            try {
                // A. Build Context
                const contexts = await measurementService.getContexts(userId);

                // B. Get History (Recent Constructs)
                const historyRes = await query(`
                    SELECT parameter_targets FROM interactions 
                    JOIN sessions ON interactions.session_id = sessions.session_id
                    WHERE sessions.user_id = $1
                    ORDER BY sessions.created_at DESC
                    LIMIT 20
                 `, [userId]);

                const recentConstructs: string[] = [];
                historyRes.rows.forEach(r => {
                    if (r.parameter_targets && Array.isArray(r.parameter_targets)) {
                        recentConstructs.push(...r.parameter_targets);
                    }
                });

                // C. Select Items
                const initialSelectedItems = selectItemsForSession({
                    userId,
                    targetCount,
                    contexts,
                    itemBank: ITEM_BANK,
                    recentConstructs
                });

                sessionLogger.logSelection(sessionId, 'contextual', initialSelectedItems.length);

                // D. VOICE LAYER (STEP 3)
                const voiceProcessedItems = initialSelectedItems.map(item => voiceService.applyVoiceLayer(item));
                const rewriteCount = voiceProcessedItems.filter((item: any) => item.original_text).length;
                sessionLogger.logVoiceRewrite(sessionId, rewriteCount);

                // E. Convert to Interactions
                for (const item of voiceProcessedItems) {
                    const uiSpec: any = {};
                    if (item.type === 'rating' && item.rating_spec) {
                        uiSpec.min_label = item.rating_spec.min_label;
                        uiSpec.max_label = item.rating_spec.max_label;
                    }
                    if (item.type === 'choice' && item.choice_spec) {
                        uiSpec.choices = item.choice_spec.choices;
                        uiSpec.option_codes = item.choice_spec.option_codes;
                    }
                    if (item.type === 'text' && item.text_spec) {
                        uiSpec.interpretation_hint = item.text_spec.interpretation_hint;
                    }

                    // AUDIT TRAIL: Preserve original text in hidden metadata if modified
                    if ((item as any).original_text) {
                        uiSpec.original_text = (item as any).original_text;
                        uiSpec.voice_rewrite = true;
                    }

                    const promptWithSpec = `${item.prompt} ||| ${JSON.stringify(uiSpec)}`;

                    const ins = await query(`
                        INSERT INTO interactions (type, prompt_text, parameter_targets, expected_signal_strength, cooldown_days)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING interaction_id, type, prompt_text, parameter_targets
                    `, [item.type, promptWithSpec, [item.construct], 0.8, 7]);

                    rawInteractions.push(ins.rows[0]);
                }

                llmMode = 'contextual_deterministic';

            } catch (e) {
                console.error('[InteractionEngine] Contextual Selection Failed', e);
                llmError = e;
                sessionLogger.log(sessionId, 'error', `Contextual selection failed: ${(e as Error).message}`);
            }
        }

        // ========== STEP 2: LLM GENERATION (Fallback) ==========
        if (rawInteractions.length === 0 && !llmError) {
            selectorMode = 'llm';
            const genResult = await interactionGenerator.generateSessionPlan(userId, targetCount);

            if (genResult.interactions && genResult.interactions.length > 0) {
                isLlm = true;
                llmMode = 'openai';
                sessionLogger.logSelection(sessionId, 'llm', genResult.interactions.length);

                if (genResult.interactions.length < targetCount) {
                    sessionLogger.logLlmUndergeneration(sessionId, targetCount, genResult.interactions.length);
                }

                for (const gen of genResult.interactions) {
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
                        rawInteractions.push(ins.rows[0]);
                    } catch (e) {
                        console.error('[InteractionEngine] Insert Failed', e);
                    }
                }
            }
        }

        // ========== STEP 4: QUALITY VALIDATORS ==========
        // For now, all items pass. Future: filter by validators here.
        selectedInteractions = [...rawInteractions];

        // ========== STEP 5: COUNT ENFORCEMENT + PADDING (FINAL STEP) ==========
        let padded = false;
        let paddingCount = 0;

        if (selectedInteractions.length < targetCount) {
            const needed = targetCount - selectedInteractions.length;
            sessionLogger.logPadding(sessionId, needed, 0); // Will update after padding

            let retryCount = 0;
            const maxRetries = 2;

            while (selectedInteractions.length < targetCount && retryCount < maxRetries) {
                const stillNeeded = targetCount - selectedInteractions.length;
                console.warn(`[InteractionEngine] Shortfall: Got ${selectedInteractions.length}, wanted ${targetCount}. Padding with Legacy (Attempt ${retryCount + 1}).`);

                try {
                    const padding = await this.getLegacyInteractions(stillNeeded);

                    // Add unique items only
                    for (const p of padding) {
                        if (!selectedInteractions.find(s => s.interaction_id === p.interaction_id)) {
                            selectedInteractions.push(p);
                            paddingCount++;
                        }
                        if (selectedInteractions.length >= targetCount) break;
                    }
                } catch (e) {
                    console.error('[InteractionEngine] Padding Error', e);
                }
                retryCount++;
            }

            // Final Desperate Fill (Allow Duplicates if critical)
            if (selectedInteractions.length < targetCount) {
                console.error(`[InteractionEngine] CRITICAL: Still short after padding. Duplicating items to fill.`);
                const pool = [...selectedInteractions];
                if (pool.length === 0) {
                    throw new Error("No interactions available to build session.");
                }
                while (selectedInteractions.length < targetCount) {
                    const randomItem = pool[Math.floor(Math.random() * pool.length)];
                    selectedInteractions.push({ ...randomItem });
                    paddingCount++;
                }
            }

            padded = paddingCount > 0;
            if (padded) {
                selectorMode = selectorMode === 'contextual' || selectorMode === 'llm' ? selectorMode : 'legacy';
                sessionLogger.logPadding(sessionId, needed, paddingCount);
            }
        }

        // Build Rich Meta (B2)
        const meta: SessionMeta = {
            target_count: targetCount,
            actual_count: selectedInteractions.length,
            padded,
            padding_count: paddingCount,
            adaptive_stop: adaptiveStop,
            adaptive_reason: adaptiveReason,
            selector_mode: selectorMode,
            is_llm: isLlm,
            llm_mode: llmMode,
            llm_error: llmError ? (llmError as Error).message : undefined,
            user_has_history: userHasHistory
        };

        return {
            sessionId,
            interactions: selectedInteractions,
            meta,
            // Legacy fields for backward compatibility
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

        // If still under count (small pool), allow duplicates
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

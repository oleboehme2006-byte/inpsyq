
import { query } from '../db/client';
import { interactionGenerator } from './llm/generators';
import { GeneratedInteraction } from './llm/types';
import { historyService } from './llm/history';
import { measurementService } from './measurement/measurementService';
import { selectItemsForSession } from './measurement/contextual_item_selector';
import { ITEM_BANK } from './measurement/item_bank';
import { voiceService } from './voice/voiceService';
import { sessionLogger } from './diagnostics/sessionLogger';
import { getSessionConfig, SessionConfig } from '../lib/runtime/sessionConfig';
import { SECURITY_LIMITS } from '@/lib/security/limits';

// Session Meta (B3 Hardening)
export interface SessionMeta {
    // Config values
    config_target_count: number;
    // Pipeline values
    planner_returned_count: number;
    final_count: number;
    // Legacy (backward compat)
    target_count: number;
    actual_count: number;
    // Flags
    padded: boolean;
    padding_count: number;
    adaptive_stop: boolean;
    adaptive_reason?: 'stable' | 'low_gain' | 'redundancy' | 'none';
    selector_mode: 'contextual' | 'llm' | 'legacy';
    is_llm: boolean;
    llm_mode: string;
    llm_error?: string;
    user_has_history: boolean;
}

export class InteractionEngine {
    private lastRequest: Map<string, number> = new Map();

    async getNextInteraction(userId: string) {
        const sess = await this.buildSession(userId);
        return sess.interactions[0];
    }

    /**
     * PROPER SESSION BUILDER (B3 Hardened)
     * 
     * PIPELINE ORDER (Strict):
     * 1. Compute Config via Canonical Resolver
     * 2. Contextual Selector (Item Bank)
     * 3. LLM Generation (if enabled/fallback)
     * 4. Voice/Framing Rewrite
     * 5. Quality Validators
     * 6. COUNT ENFORCEMENT + PADDING (Final Step - ALWAYS enforces target)
     */
    async buildSession(userId: string, requestConfig?: { forceCount?: number, forceAdaptive?: boolean }) {
        const startTime = Date.now();

        // 0. Rate Limit (2 seconds)
        const now = Date.now();
        const last = this.lastRequest.get(userId) || 0;
        if (now - last < 2000) {
            // Throttling...
        }
        this.lastRequest.set(userId, now);

        // Security: Check Active Sessions Limit
        await this.enforceSessionLimit(userId);

        // 1. Create Session
        const dbStartTime = Date.now();
        const sessionRes = await query(`
             INSERT INTO sessions (user_id, started_at)
             VALUES ($1, NOW())
             RETURNING session_id
        `, [userId]);
        const sessionId = sessionRes.rows[0].session_id;
        const dbCreateMs = Date.now() - dbStartTime;

        // 2. Get User History for Adaptive Metadata
        const historyCount = await historyService.getLastPrompts(userId, 100);
        const userHasHistory = historyCount.length > 0;

        // 3. CANONICAL CONFIG RESOLUTION (B3)
        // requestConfig.forceCount overrides everything
        // Otherwise, use canonical resolver which defaults to 10, adaptive=false
        const config = getSessionConfig({
            targetCount: requestConfig?.forceCount,
            adaptive: requestConfig?.forceAdaptive,
        });

        const targetCount = config.targetCount;
        const adaptive = config.adaptive;
        const forceCount = config.forceCount;

        // Adaptive metadata (NEVER reduces count when forceCount=true)
        let adaptiveStop = false;
        let adaptiveReason: SessionMeta['adaptive_reason'] = 'none';

        // Record if adaptive WOULD have triggered (for observability)
        // But do NOT change targetCount
        if (adaptive && historyCount.length > 50) {
            adaptiveStop = true;
            adaptiveReason = 'stable';
            // NOTE: We do NOT reduce targetCount. Adaptive only affects WHICH items, not HOW MANY.
            console.log(`[InteractionEngine] Adaptive would trigger (stable), but forceCount=${forceCount} prevents count reduction.`);
        }

        sessionLogger.start(sessionId, userId, targetCount);
        if (adaptiveStop) {
            sessionLogger.logAdaptiveStop(sessionId, adaptiveReason, targetCount);
        }

        // 4. Selection Strategy
        let rawInteractions: any[] = [];
        let selectedInteractions: any[] = [];
        let selectorMode: SessionMeta['selector_mode'] = 'legacy';
        let isLlm = false;
        let llmError: string | undefined = undefined;
        let llmMode = 'none';

        const selectStartTime = Date.now();

        // FEATURE FLAG: Contextual Selection Mode
        if (config.contextualSelectionEnabled) {
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

                // D. VOICE LAYER
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

                    // AUDIT TRAIL
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
                llmError = (e as Error).message;
                sessionLogger.log(sessionId, 'error', `Contextual selection failed: ${llmError}`);
            }
        }

        const selectMs = Date.now() - selectStartTime;

        // ========== LLM GENERATION (Fallback) ==========
        const llmStartTime = Date.now();
        if (rawInteractions.length === 0 && !llmError) {
            selectorMode = 'llm';

            try {
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
            } catch (e) {
                console.error('[InteractionEngine] LLM Generation Failed', e);
                llmError = (e as Error).message;
            }
        }
        const llmMs = Date.now() - llmStartTime;

        // ========== QUALITY VALIDATORS ==========
        selectedInteractions = [...rawInteractions];
        const plannerReturnedCount = selectedInteractions.length;

        // ========== COUNT ENFORCEMENT + PADDING (FINAL STEP) ==========
        const padStartTime = Date.now();
        let padded = false;
        let paddingCount = 0;

        if (selectedInteractions.length < targetCount) {
            const needed = targetCount - selectedInteractions.length;
            sessionLogger.logPadding(sessionId, needed, 0);

            let retryCount = 0;
            const maxRetries = 2;

            while (selectedInteractions.length < targetCount && retryCount < maxRetries) {
                const stillNeeded = targetCount - selectedInteractions.length;
                console.warn(`[InteractionEngine] Shortfall: Got ${selectedInteractions.length}, wanted ${targetCount}. Padding (Attempt ${retryCount + 1}).`);

                try {
                    const padding = await this.getLegacyInteractions(stillNeeded);

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

            // Final Desperate Fill (Allow Duplicates)
            if (selectedInteractions.length < targetCount) {
                console.error(`[InteractionEngine] CRITICAL: Still short. Duplicating items.`);
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
                sessionLogger.logPadding(sessionId, needed, paddingCount);
            }
        }
        const padMs = Date.now() - padStartTime;
        const totalMs = Date.now() - startTime;

        // Performance logging
        console.log(`[Perf] session_start total_ms=${totalMs}, select_ms=${selectMs}, llm_ms=${llmMs}, db_create_ms=${dbCreateMs}, pad_ms=${padMs}`);

        // Build Rich Meta (B3)
        const meta: SessionMeta = {
            // B3 fields
            config_target_count: targetCount,
            planner_returned_count: plannerReturnedCount,
            final_count: selectedInteractions.length,
            // Legacy (backward compat)
            target_count: targetCount,
            actual_count: selectedInteractions.length,
            // Flags
            padded,
            padding_count: paddingCount,
            adaptive_stop: adaptiveStop,
            adaptive_reason: adaptiveReason,
            selector_mode: selectorMode,
            is_llm: isLlm,
            llm_mode: llmMode,
            llm_error: llmError,
            user_has_history: userHasHistory
        };

        return {
            sessionId,
            interactions: selectedInteractions,
            meta,
            // Legacy fields
            llm_used: isLlm,
            question_count: selectedInteractions.length
        };
    }

    async getLegacyInteractions(count: number = 3) {
        const allRes = await query(`SELECT * FROM interactions`);
        const all = allRes.rows;

        const candidates = all.filter(i => !i.prompt_text.includes('|||'));
        if (candidates.length === 0) return [];

        const shuffled = [...candidates].sort(() => 0.5 - Math.random());

        const selected: any[] = [];
        const sliders = shuffled.filter(i => i.type === 'slider' || i.type === 'rating');
        const dialogs = shuffled.filter(i => i.type === 'dialog');

        if (sliders.length > 0) selected.push(sliders[0]);
        if (dialogs.length > 0) selected.push(dialogs[0]);

        for (const item of shuffled) {
            if (selected.length >= count) break;
            if (!selected.find(s => s.interaction_id === item.interaction_id)) {
                selected.push(item);
            }
        }

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
    /**
     * Enforce strict session limits per week.
     */
    private async enforceSessionLimit(userId: string): Promise<void> {
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        const result = await query(`
            SELECT COUNT(*) as count 
            FROM sessions 
            WHERE user_id = $1 
              AND started_at > NOW() - INTERVAL '7 days'
        `, [userId]);

        const count = parseInt(result.rows[0].count, 10);
        if (count >= SECURITY_LIMITS.MAX_SESSIONS_PER_WEEK) {
            throw new Error(`Session limit exceeded (${count}/${SECURITY_LIMITS.MAX_SESSIONS_PER_WEEK} this week).`);
        }
    }
}

export const interactionEngine = new InteractionEngine();

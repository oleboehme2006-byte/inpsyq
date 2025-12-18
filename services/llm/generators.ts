import { getOpenAIClient, LLM_CONFIG } from './client';
import { historyService } from './history';
import { GeneratedInteraction } from './types';
import { CONSTRUCTS } from '@/services/measurement/constructs';
import { itemBank, AssessmentType } from '@/services/measurement/item_bank';

export class InteractionGenerator {

    async generateSessionPlan(userId: string, count: number = LLM_CONFIG.session_questions): Promise<{ interactions: GeneratedInteraction[], error?: any }> {
        const openai = getOpenAIClient();
        if (!openai) return { interactions: [], error: { reason: "missing_key", messageSafe: "OPENAI_API_KEY not found" } };

        try {
            const history = await historyService.getLastPrompts(userId, 30);
            const constructsList = CONSTRUCTS.join(', ');

            // Updated System Prompt for Evidence-Based Layer with Coverage Planning
            const systemPrompt = `
            You are an expert organizational psychologist.
            Goal: Generate ${count} valid measurement items (interactions) for an employee check-in.
            
            Canonical Constructs: ${constructsList}.

            Plan Requirements:
            1. **Coverage**: Ensure at least 5 distict constructs are measured in this session.
            2. **Form Factor**: Mix 'rating' (Likert), 'choice' (Situational), and 'text' (Open-ended).
            3. **Anti-Repetition**: Do NOT reuse themes from: ${history.slice(0, 5).join('; ')}.
            
            CRITICAL - OPTION CODING:
            - For 'choice' type, you MUST provide 'option_codes'.
            - Each option needs a specific 'coding': List of Evidence signals it implies.
            - Evidence schema: { construct, direction (1 or -1), strength (0.1-1.0), confidence (0.1-1.0), explanation }.
            
            Output strictly valid JSON obeying the schema.
            `;

            // Strict Schema Definition
            const schema = {
                type: "json_schema",
                json_schema: {
                    name: "session_plan_evidence",
                    schema: {
                        type: "object",
                        properties: {
                            interactions: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        type: { type: "string", enum: ["rating", "choice", "text"] },
                                        prompt_text: { type: "string" },
                                        construct: { type: "string", enum: ["psychological_safety", "trust", "autonomy", "meaning", "fairness", "workload", "role_clarity", "social_support", "learning_climate", "leadership_quality", "adaptive_capacity", "engagement"] },
                                        targets: { type: "array", items: { type: "string" } }, // Keep for legacy compat
                                        response_spec: {
                                            type: "object",
                                            properties: {
                                                min_label: { type: ["string", "null"] },
                                                max_label: { type: ["string", "null"] },
                                                choices: {
                                                    type: ["array", "null"],
                                                    items: {
                                                        type: "object",
                                                        properties: {
                                                            label: { type: "string" },
                                                            coding: {
                                                                type: "array",
                                                                items: {
                                                                    type: "object",
                                                                    properties: {
                                                                        construct: { type: "string" },
                                                                        direction: { type: "number" },
                                                                        strength: { type: "number" },
                                                                        confidence: { type: "number" },
                                                                        evidence_type: { type: "string", enum: ['affect', 'cognition', 'behavior_intent', 'social', 'self_report'] },
                                                                        explanation_short: { type: "string" }
                                                                    },
                                                                    required: ["construct", "direction", "strength", "confidence", "evidence_type", "explanation_short"],
                                                                    additionalProperties: false
                                                                }
                                                            }
                                                        },
                                                        required: ["label", "coding"],
                                                        additionalProperties: false
                                                    }
                                                },
                                                guidance: { type: ["string", "null"] }
                                            },
                                            required: ["min_label", "max_label", "choices", "guidance"],
                                            additionalProperties: false
                                        },
                                        psych_rationale: { type: "string" }
                                    },
                                    required: ["type", "prompt_text", "construct", "targets", "response_spec", "psych_rationale"],
                                    additionalProperties: false
                                }
                            }
                        },
                        required: ["interactions"],
                        additionalProperties: false
                    },
                    strict: true
                }
            };

            const completion = await openai.chat.completions.create({
                model: LLM_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate ${count} interactions. Avoid:\n${history.map(h => `- ${h}`).join('\n')}` }
                ],
                // @ts-ignore
                response_format: schema,
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error('Empty LLM response');

            const plan = JSON.parse(content);
            const interactions = plan.interactions.map((i: any) => {
                // Sanitize nulls
                if (i.response_spec) {
                    const rs = i.response_spec;
                    if (!rs.min_label && !rs.max_label && (!rs.choices || rs.choices.length === 0)) {
                        if (i.type === 'text') i.response_spec = undefined;
                    } else {
                        Object.keys(rs).forEach(k => { if (rs[k] === null) delete rs[k]; });
                    }
                }

                // --- ITEM BANK VALIDATION ---
                // Heuristic Quality Check
                const quality = itemBank.validateItemQuality(i.prompt_text, i.type as AssessmentType, i.construct || 'unknown');
                if (quality.clarity < 0.5) {
                    console.warn(`[Generator] Low Quality Item Detected (${quality.flags.join(',')}) - Prompt: "${i.prompt_text.slice(0, 30)}..."`);
                    // We could filter it out, but for now just log it.
                    // Ideally we would regenerate or pick fallback.
                }

                return i;
            });

            // Duplicates Logic
            // ... (keep usage logging) ...
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[LLM] Generated ${interactions.length} items (Measurement Layer).`);
            }

            return { interactions };

        } catch (error: any) {
            console.error('[LLM] Generator Error:', error);
            return {
                interactions: [],
                error: {
                    reason: "openai_error",
                    code: error.code || 'unknown',
                    messageSafe: error.message || 'Unknown',
                    model: LLM_CONFIG.model
                }
            };
        }
    }
}

export const interactionGenerator = new InteractionGenerator();

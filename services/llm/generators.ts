import { getOpenAIClient, LLM_CONFIG } from './client';
import { historyService } from './history';
import { GeneratedInteraction } from './types';
import { PARAMETERS } from '@/lib/constants';

export class InteractionGenerator {

    async generateSessionPlan(userId: string, count: number = LLM_CONFIG.session_questions): Promise<{ interactions: GeneratedInteraction[], error?: any }> {
        const openai = getOpenAIClient();
        if (!openai) return { interactions: [], error: { reason: "missing_key", messageSafe: "OPENAI_API_KEY not found" } };

        try {
            // 1. Fetch History
            const history = await historyService.getLastPrompts(userId, 30); // Check last 30 for deeper history

            // 2. Build System Prompt
            const systemPrompt = `
            You are an expert organizational psychologist designed to generate employee check-in questions.
            Target Parameters: ${PARAMETERS.join(', ')}.
            
            Goal: Generate a session plan with ${count} interactions.
            Structure:
            - Mix of 'rating' (1-7/0-10), 'choice' (3-5 options), and 'text'.
            - Maximize variety in constructs: Clarity, Autonomy, Support, Workload, Conflict, Meaning, Safety, Trust, Growth, Ambiguity.
            
            Constraints:
            - Neutral, non-leading phrasing.
            - "Last 7 days" time window context.
            - Avoid medical or diagnostic language.
            - One construct per question.
            - DO NOT repeat recent questions provided in context.

            CRITICAL - Choice Options:
            - For 'choice' type, you MUST generate semantic options that match the question.
            - Do NOT use generic labels like "High Control" or "Positive".
            - Example: Q: "How clear were your tasks?" -> Options: ["Very Clear", "Somewhat Ambiguous", "Confusing"].
            
            Output strictly valid JSON matching the schema.
            IMPORTANT: For 'response_spec', you MUST provide all fields. Set fields to null if they do not apply to the interaction type.
            - 'text': set all response_spec fields to null.
            - 'rating': set min_label/max_label, set choices to null.
            - 'choice': set choices, set min/max_label to null.
            `;

            const schema = {
                type: "json_schema",
                json_schema: {
                    name: "session_plan",
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
                                        targets: {
                                            type: "array",
                                            items: { type: "string", enum: PARAMETERS }
                                        },
                                        response_spec: {
                                            type: "object",
                                            properties: {
                                                min_label: { type: ["string", "null"] },
                                                max_label: { type: ["string", "null"] },
                                                choices: { type: ["array", "null"], items: { type: "string" } },
                                                guidance: { type: ["string", "null"] }
                                            },
                                            required: ["min_label", "max_label", "choices", "guidance"],
                                            additionalProperties: false
                                        },
                                        psych_rationale: { type: "string" }
                                    },
                                    required: ["type", "prompt_text", "targets", "response_spec", "psych_rationale"],
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

            // 3. Retry Loop for Uniqueness
            let attempts = 0;
            const MAX_ATTEMPTS = 3;

            while (attempts < MAX_ATTEMPTS) {
                const completion = await openai.chat.completions.create({
                    model: LLM_CONFIG.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Generate ${count} interactions. Recent history to avoid:\n${history.map(h => `- ${h}`).join('\n')}` }
                    ],
                    // @ts-ignore
                    response_format: schema,
                    // temperature: 0.7 + (attempts * 0.1), // gpt-5-mini enforces temp=1
                });

                const content = completion.choices[0].message.content;
                if (!content) throw new Error('Empty LLM response');

                const plan = JSON.parse(content);

                // Sanitize: Nullable fields to undefined for app logic compatibility
                // We map raw JSON to strict GeneratedInteraction type
                const interactions = plan.interactions.map((i: any) => {
                    // Clean up response_spec
                    if (i.response_spec) {
                        const rs = i.response_spec;
                        // Determine if it should exist at all
                        if (!rs.min_label && !rs.max_label && (!rs.choices || rs.choices.length === 0) && !rs.guidance) {
                            // If all are null/empty, logical cleanup (especially for text type)
                            if (i.type === 'text') i.response_spec = undefined;
                        } else {
                            // Remove null keys explicitly
                            Object.keys(rs).forEach(k => {
                                if (rs[k] === null) delete rs[k];
                            });
                        }
                    }
                    return i;
                }) as GeneratedInteraction[];

                // Verify Uniqueness (Intra-session + History)
                const uniqueInSession = new Set();
                const duplicates = interactions.filter(i => {
                    const sim = historyService.isTooSimilar(i.prompt_text, history);
                    const isDupInSession = uniqueInSession.has(i.prompt_text);
                    uniqueInSession.add(i.prompt_text);
                    return sim || isDupInSession;
                });

                if (duplicates.length === 0 && interactions.length >= count) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.log(`[LLM] model=${LLM_CONFIG.model} used=true generated=${interactions.length}`);
                    }
                    return { interactions };
                }

                console.log(`[LLM] Generated duplicates or insufficient count: ${duplicates.length}. Retrying...`);
                attempts++;
            }

            console.warn('[LLM] Failed to generate unique interactions after retries.');
            return { interactions: [], error: { reason: "max_retries_exceeded", messageSafe: "Failed to generate unique interactions" } };

        } catch (error: any) {
            console.error('[LLM] Generator Error:', error);
            return {
                interactions: [],
                error: {
                    reason: "openai_error",
                    code: error.code || error.status || 'unknown',
                    messageSafe: error.message || 'Unknown error',
                    model: LLM_CONFIG.model
                }
            };
        }
    }
}

export const interactionGenerator = new InteractionGenerator();

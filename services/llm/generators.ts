import { getOpenAIClient, LLM_CONFIG } from './client';
import { historyService } from './history';
import { GeneratedInteraction } from './types';
import { PARAMETERS } from '@/lib/constants';

export class InteractionGenerator {

    async generateSessionPlan(userId: string, count: number = LLM_CONFIG.session_questions): Promise<GeneratedInteraction[] | null> {
        const openai = getOpenAIClient();
        if (!openai) return null; // Fallback to legacy

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
                                                min_label: { type: "string" },
                                                max_label: { type: "string" },
                                                choices: { type: "array", items: { type: "string" } },
                                                guidance: { type: "string" }
                                            },
                                            additionalProperties: false
                                        },
                                        psych_rationale: { type: "string" }
                                    },
                                    required: ["type", "prompt_text", "targets", "psych_rationale"],
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
                    temperature: 0.7 + (attempts * 0.1),
                });

                const content = completion.choices[0].message.content;
                if (!content) throw new Error('Empty LLM response');

                const plan = JSON.parse(content);
                const interactions = plan.interactions as GeneratedInteraction[];

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
                    return interactions;
                }

                console.log(`[LLM] Generated duplicates or insufficient count: ${duplicates.length}. Retrying...`);
                attempts++;
            }

            console.warn('[LLM] Failed to generate unique interactions after retries.');
            return null;

        } catch (error) {
            console.error('[LLM] Generator Error:', error);
            return null;
        }
    }
}

export const interactionGenerator = new InteractionGenerator();

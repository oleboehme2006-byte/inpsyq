import { getOpenAIClient, LLM_CONFIG } from './client';
import { safeToFixed } from '@/lib/utils/safeNumber';
import { CodingResult } from '@/services/measurement/evidence';
import { Parameter } from '@/lib/constants';
import { CONSTRUCTS } from '@/services/measurement/constructs';
import { RESPONSE_CODING_PROMPT } from './prompts/response-coding';

import { InterpretationContext } from '../interpretation/context';

export class ResponseInterpreter {

    async code(text: string, context: { prompt?: string, construct?: string, history?: InterpretationContext }): Promise<CodingResult | null> {
        const openai = getOpenAIClient();
        if (!openai) return null; // Fallback to heuristic

        try {
            // Build Context String
            let temporalContext = "None";
            if (context.history && context.history.significant_history.length > 0) {
                temporalContext = context.history.significant_history
                    .map(h => `- ${h.construct}: Trend=${h.trend}, Volatility=${safeToFixed(h.volatility, 2)}`)
                    .join('\n');
            }

            const template = RESPONSE_CODING_PROMPT;
            const systemPrompt = template.system({
                contextHistory: temporalContext,
                primaryConstruct: context.construct || 'Infer from text',
                promptText: context.prompt || '',
                responseText: text
            });
            const userPrompt = template.user({
                contextHistory: temporalContext,
                primaryConstruct: context.construct || 'Infer from text',
                promptText: context.prompt || '',
                responseText: text
            });

            const schema = {
                type: "json_schema",
                json_schema: {
                    name: "coding_result",
                    schema: {
                        type: "object",
                        properties: {
                            evidence: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        construct: { type: "string", enum: CONSTRUCTS },
                                        direction: { type: "number" }, // 1 or -1
                                        strength: { type: "number" }, // 0..1
                                        confidence: { type: "number" }, // 0..1
                                        evidence_type: { type: "string", enum: ['affect', 'cognition', 'behavior_intent', 'social', 'self_report'] },
                                        explanation_short: { type: "string" }
                                    },
                                    required: ["construct", "direction", "strength", "confidence", "evidence_type", "explanation_short"],
                                    additionalProperties: false
                                }
                            },
                            flags: {
                                type: "object",
                                properties: {
                                    off_topic: { type: "boolean" },
                                    ambiguous: { type: "boolean" },
                                    sensitive: { type: "boolean" }
                                },
                                required: ["off_topic", "ambiguous", "sensitive"], // strict requires all properties in object
                                additionalProperties: false
                            }
                        },
                        required: ["evidence", "flags"],
                        additionalProperties: false
                    },
                    strict: true
                }
            };

            const completion = await openai.chat.completions.create({
                model: LLM_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                // @ts-ignore
                response_format: schema,
                // temperature: 0, // gpt-5-mini enforces temp=1 even for strict mode
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error('Empty LLM response');

            const result = JSON.parse(content) as CodingResult;
            return result;

        } catch (error) {
            console.error('[LLM] Interpreter Error:', error);
            return null;
        }
    }
}

export const responseInterpreter = new ResponseInterpreter();

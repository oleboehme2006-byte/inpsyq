import { getOpenAIClient, LLM_CONFIG } from './client';
import { safeToFixed } from '@/lib/utils/safeNumber';
import { CodingResult } from '@/services/measurement/evidence';
import { Parameter } from '@/lib/constants';
import { CONSTRUCTS } from '@/services/measurement/constructs';

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

            const systemPrompt = `
            You are an expert organizational psychologist.
            Task: Code the employee response into "Evidence" signals for psychological constructs.
            
            Constructs: ${CONSTRUCTS.join(', ')}.
            
            Contextual Awareness:
            The user has the following historical patterns (Interpretation Context):
            ${temporalContext}
            
            EPISTEMIC CONTRACT:
            - OBSERVED: Explicit statements or behaviors (e.g., "I quit"). High Confidence.
            - INFERRED: Latent states (e.g., "I feel unsafe"). Medium Confidence unless explicit.
            - HYPOTHETICAL: "If X then Y". Label as 'cognition' with Low Confidence.
            
            Rules:
            - If text is irrelevant/nonsense, return empty evidence and flag off_topic.
            - If text is vague, use low confidence.
            - If new text contradicts historical trend, flag meaningful shift.
            - Max 3 evidence items per response.
            - Primary Construct: ${context.construct || 'Infer from text'}.
            - DO NOT hallucinate metrics not present in text.
            
            Output strictly valid JSON.
            `;

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
                    { role: 'user', content: `Context: "${context.prompt || ''}"\nInput: "${text}"` }
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

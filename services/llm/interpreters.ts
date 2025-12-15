import { getOpenAIClient, LLM_CONFIG } from './client';
import { InterpretationResult, InterpretedSignal } from './types';
import { Parameter } from '@/lib/constants';

export class ResponseInterpreter {

    async interpret(text: string, targets: Parameter[]): Promise<InterpretationResult | null> {
        const openai = getOpenAIClient();
        if (!openai) return null; // Fallback to heuristic

        try {
            const systemPrompt = `
            You are an expert organizational psychologist.
            Analyze the input for the target parameters: ${targets.join(', ')}.
            
            Task:
            1. Extract signal intensity (0.0 - 1.0) for each parameter.
            2. Assign confidence (0.0 - 1.0).
            3. Flag safety risks (self_harm, imminent_violence).
            4. Assess ambiguity.
            
            Constraints:
            - Signals must be supported by text.
            - If text is irrelevant/nonsense, mark ambiguity='high' and low confidence.
            - If self_harm risk, flag it.
            
            Output strictly valid JSON.
            `;

            const schema = {
                type: "json_schema",
                json_schema: {
                    name: "interpretation_result",
                    schema: {
                        type: "object",
                        properties: {
                            signals: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        parameter: { type: "string", enum: targets },
                                        value: { type: "number" },
                                        confidence: { type: "number" },
                                        evidence_snippet: { type: "string" }
                                    },
                                    required: ["parameter", "value", "confidence"],
                                    additionalProperties: false
                                }
                            },
                            notes: {
                                type: "object",
                                properties: {
                                    ambiguity: { type: "string", enum: ["low", "medium", "high"] },
                                    safety_flags: { type: "array", items: { type: "string" } }
                                },
                                required: ["ambiguity", "safety_flags"],
                                additionalProperties: false
                            }
                        },
                        required: ["signals", "notes"],
                        additionalProperties: false
                    },
                    strict: true
                }
            };

            const completion = await openai.chat.completions.create({
                model: LLM_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Input: "${text}"` }
                ],
                // @ts-ignore
                response_format: schema,
                temperature: 0,
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error('Empty LLM response');

            const result = JSON.parse(content) as InterpretationResult;

            // Post-processing / Clamping
            result.signals = result.signals.map(s => ({
                ...s,
                value: Math.max(0, Math.min(1, s.value)),
                confidence: Math.max(0, Math.min(1, s.confidence))
            }));

            return result;

        } catch (error) {
            console.error('[LLM] Interpreter Error:', error);
            return null;
        }
    }
}

export const responseInterpreter = new ResponseInterpreter();

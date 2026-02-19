/**
 * OPENAI PROVIDER
 * 
 * Production-grade OpenAI implementation using fetch.
 * Features:
 * - Exponential backoff retries
 * - Strict JSON enforcement
 * - Timeouts via AbortController
 * - Detailed error mapping
 */

import { LLMProvider, LLMResult, LLMError, LLMFailure } from './types';
import { getLLMConfig } from './config';
import { getModelCapabilities } from './modelRegistry';

export class OpenAIProvider implements LLMProvider {
    private readonly config = getLLMConfig();

    async generateJSON<T>(
        systemPrompt: string,
        userPrompt: string,
        modelOverride?: string
    ): Promise<LLMResult<T>> {
        const model = modelOverride || this.config.model;
        let attempt = 0;
        const maxRetries = this.config.maxRetries;

        while (attempt <= maxRetries) {
            try {
                return await this.executeCall<T>(systemPrompt, userPrompt, model);
            } catch (error: any) {
                // If last attempt, return failure
                if (attempt === maxRetries) {
                    return this.mapError(error, model);
                }

                // Check if retryable
                const mapped = this.mapError(error, model);
                if (!mapped.error.retryable) {
                    return mapped;
                }

                // Backoff wait
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
            }
        }

        return this.mapError(new Error('Max retries exceeded'), model);
    }

    private async executeCall<T>(
        systemPrompt: string,
        userPrompt: string,
        model: string
    ): Promise<LLMResult<T>> {
        if (!this.config.apiKey) {
            throw new Error('MISSING_KEY');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

        try {
            // Item 3.15: Use model registry instead of hardcoded checks
            const caps = getModelCapabilities(model);

            const tokenParam = caps.usesCompletionTokens
                ? { max_completion_tokens: this.config.maxTokensTeam }
                : { max_tokens: this.config.maxTokensTeam };

            // Build messages based on model capabilities
            const messages = caps.supportsSystemMessages
                ? [
                    { role: 'system', content: systemPrompt + '\n\nCRITICAL: Return ONLY valid JSON. No markdown formatting.' },
                    { role: 'user', content: userPrompt }
                ]
                : [
                    { role: 'user', content: systemPrompt + '\n\nCRITICAL: Return ONLY valid JSON. No markdown formatting.\n\n' + userPrompt }
                ];

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
                body: JSON.stringify({
                    model: model,
                    messages,
                    response_format: caps.supportsJsonMode ? { type: 'json_object' } : undefined,
                    temperature: caps.defaultTemperature,
                    ...tokenParam,
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`OpenAI HTTP ${response.status}: ${text}`);
            }

            const data = await response.json();
            const rawContent = data.choices?.[0]?.message?.content || '';
            const usage = data.usage;

            // Strict JSON parse
            let parsed: T;
            try {
                parsed = JSON.parse(rawContent);
            } catch (e) {
                return {
                    ok: false,
                    error: {
                        code: 'INVALID_JSON',
                        message: 'Failed to parse JSON response',
                        retryable: true, // Sometimes retrying fixes formatting
                        provider: 'openai',
                        model
                    },
                    raw: rawContent
                };
            }

            return {
                ok: true,
                json: parsed,
                raw: rawContent,
                usage: {
                    inputTokens: usage?.prompt_tokens,
                    outputTokens: usage?.completion_tokens,
                    totalTokens: usage?.total_tokens
                },
                model,
                provider: 'openai'
            };

        } finally {
            clearTimeout(timeoutId);
        }
    }

    private mapError(error: any, model: string): LLMFailure {
        let code: LLMError['code'] = 'PROVIDER_ERROR';
        let retryable = false;
        const msg = error.message || String(error);

        if (msg === 'MISSING_KEY') {
            code = 'MISSING_KEY';
        } else if (error.name === 'AbortError' || msg.includes('timeout')) {
            code = 'TIMEOUT';
            retryable = true;
        } else if (msg.includes('429') || msg.includes('rate limit')) {
            code = 'RATE_LIMIT';
            retryable = true;
        } else if (msg.includes('500') || msg.includes('502') || msg.includes('503')) {
            code = 'PROVIDER_ERROR';
            retryable = true;
        }

        return {
            ok: false,
            error: {
                code,
                message: msg,
                retryable,
                provider: 'openai',
                model
            }
        };
    }
}

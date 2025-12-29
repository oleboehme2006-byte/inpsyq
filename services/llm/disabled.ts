/**
 * DISABLED PROVIDER
 * 
 * Safe fallback that always returns a DISABLED error.
 * Used when no API key is present or LLM integration is turned off.
 */

import { LLMProvider, LLMResult, LLMError } from './types';

export class DisabledProvider implements LLMProvider {
    async generateJSON<T>(): Promise<LLMResult<T>> {
        const error: LLMError = {
            code: 'DISABLED',
            message: 'LLM generation is disabled or not configured',
            retryable: false,
            provider: 'disabled',
            model: null
        };

        return {
            ok: false,
            error
        };
    }
}

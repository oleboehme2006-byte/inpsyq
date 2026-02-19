/**
 * MODEL REGISTRY — LLM Model Capabilities
 * 
 * Item 3.15: Maps model names to their API capabilities.
 * Prevents hardcoded parameter guessing in the provider.
 */

export interface ModelCapabilities {
    /** Use max_completion_tokens instead of max_tokens */
    readonly usesCompletionTokens: boolean;
    /** Supports response_format: json_object */
    readonly supportsJsonMode: boolean;
    /** Supports system messages */
    readonly supportsSystemMessages: boolean;
    /** Default temperature (reasoning models may ignore this) */
    readonly defaultTemperature: number;
    /** Model family for logging */
    readonly family: 'gpt' | 'o-series' | 'unknown';
}

const REGISTRY: Record<string, ModelCapabilities> = {
    // GPT-4 family
    'gpt-4': { usesCompletionTokens: false, supportsJsonMode: true, supportsSystemMessages: true, defaultTemperature: 0.2, family: 'gpt' },
    'gpt-4o': { usesCompletionTokens: false, supportsJsonMode: true, supportsSystemMessages: true, defaultTemperature: 0.2, family: 'gpt' },
    'gpt-4o-mini': { usesCompletionTokens: false, supportsJsonMode: true, supportsSystemMessages: true, defaultTemperature: 0.2, family: 'gpt' },
    'gpt-4-turbo': { usesCompletionTokens: false, supportsJsonMode: true, supportsSystemMessages: true, defaultTemperature: 0.2, family: 'gpt' },

    // GPT-5 family
    'gpt-5-mini': { usesCompletionTokens: true, supportsJsonMode: true, supportsSystemMessages: true, defaultTemperature: 0.2, family: 'gpt' },

    // O-series (reasoning models)
    'o1': { usesCompletionTokens: true, supportsJsonMode: true, supportsSystemMessages: false, defaultTemperature: 1, family: 'o-series' },
    'o1-mini': { usesCompletionTokens: true, supportsJsonMode: true, supportsSystemMessages: false, defaultTemperature: 1, family: 'o-series' },
    'o1-preview': { usesCompletionTokens: true, supportsJsonMode: true, supportsSystemMessages: false, defaultTemperature: 1, family: 'o-series' },
    'o3': { usesCompletionTokens: true, supportsJsonMode: true, supportsSystemMessages: true, defaultTemperature: 1, family: 'o-series' },
    'o3-mini': { usesCompletionTokens: true, supportsJsonMode: true, supportsSystemMessages: true, defaultTemperature: 1, family: 'o-series' },
    'o4-mini': { usesCompletionTokens: true, supportsJsonMode: true, supportsSystemMessages: true, defaultTemperature: 1, family: 'o-series' },
};

/**
 * Get capabilities for a model. Falls back to safe defaults for unknown models.
 */
export function getModelCapabilities(model: string): ModelCapabilities {
    // Exact match
    if (REGISTRY[model]) return REGISTRY[model];

    // Prefix match (e.g., 'gpt-4o-2024-05-13' → 'gpt-4o')
    for (const [key, caps] of Object.entries(REGISTRY)) {
        if (model.startsWith(key)) return caps;
    }

    // Heuristic fallback
    if (model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4')) {
        return { usesCompletionTokens: true, supportsJsonMode: true, supportsSystemMessages: false, defaultTemperature: 1, family: 'o-series' };
    }

    // Safe default: GPT-style
    console.warn(`[ModelRegistry] Unknown model "${model}", using GPT defaults`);
    return { usesCompletionTokens: false, supportsJsonMode: true, supportsSystemMessages: true, defaultTemperature: 0.2, family: 'unknown' };
}

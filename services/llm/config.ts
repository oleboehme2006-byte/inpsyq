/**
 * LLM CONFIGURATION
 * 
 * Centralized configuration for LLM providers, limits, and timeouts.
 * Enforces hard caps on token usage and concurrency.
 */

// Default values
const DEFAULTS = {
    PROVIDER: 'disabled',
    MODEL: 'gpt-5-mini',
    TIMEOUT_MS: 20_000,
    MAX_TOKENS_TEAM: 1200,
    MAX_TOKENS_EXEC: 1600,
    MAX_RETRIES: 2,
    CONCURRENCY: 2,
    NUMERIC_CAP: 6,
} as const;

// Hard safety caps (never exceed these regardless of env)
const SAFETY_CAPS = {
    MAX_TOKENS_ABSOLUTE: 2500,
    MAX_CONCURRENCY_ABSOLUTE: 5,
} as const;

export interface LLMConfig {
    provider: 'openai' | 'disabled';
    apiKey?: string;
    model: string;
    timeoutMs: number;
    maxTokensTeam: number;
    maxTokensExec: number;
    maxRetries: number;
    concurrency: number;
    numericCap: number;
}

export function getLLMConfig(): LLMConfig {
    const rawProvider = process.env.LLM_PROVIDER || DEFAULTS.PROVIDER;
    const provider = rawProvider === 'openai' ? 'openai' : 'disabled';

    // Determine token limits
    let maxTokensTeam = parseInt(process.env.LLM_MAX_TOKENS_TEAM || String(DEFAULTS.MAX_TOKENS_TEAM), 10);
    let maxTokensExec = parseInt(process.env.LLM_MAX_TOKENS_EXEC || String(DEFAULTS.MAX_TOKENS_EXEC), 10);

    // Enforce safety caps
    if (maxTokensTeam > SAFETY_CAPS.MAX_TOKENS_ABSOLUTE) maxTokensTeam = SAFETY_CAPS.MAX_TOKENS_ABSOLUTE;
    if (maxTokensExec > SAFETY_CAPS.MAX_TOKENS_ABSOLUTE) maxTokensExec = SAFETY_CAPS.MAX_TOKENS_ABSOLUTE;

    let concurrency = parseInt(process.env.LLM_CONCURRENCY || String(DEFAULTS.CONCURRENCY), 10);
    if (concurrency > SAFETY_CAPS.MAX_CONCURRENCY_ABSOLUTE) concurrency = SAFETY_CAPS.MAX_CONCURRENCY_ABSOLUTE;

    return {
        provider,
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.LLM_MODEL || DEFAULTS.MODEL,
        timeoutMs: parseInt(process.env.LLM_TIMEOUT_MS || String(DEFAULTS.TIMEOUT_MS), 10),
        maxTokensTeam,
        maxTokensExec,
        maxRetries: parseInt(process.env.LLM_MAX_RETRIES || String(DEFAULTS.MAX_RETRIES), 10),
        concurrency,
        numericCap: parseInt(process.env.LLM_NUMERIC_CAP || String(DEFAULTS.NUMERIC_CAP), 10),
    };
}

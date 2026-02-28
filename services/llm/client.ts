import OpenAI from 'openai';

export const getOpenAIClient = (): OpenAI | null => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.warn('[LLM] No OPENAI_API_KEY found. LLM features disabled.');
        return null; // Fallback mode
    }
    return new OpenAI({
        apiKey: apiKey,
        timeout: 30_000,
        maxRetries: 2,
    });
};

export const LLM_CONFIG = {
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.2'),
    max_tokens: parseInt(process.env.LLM_MAX_OUTPUT_TOKENS || '600'),
    session_questions: parseInt(process.env.SESSION_QUESTION_COUNT || '10')
};


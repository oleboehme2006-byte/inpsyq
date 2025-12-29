/**
 * LLM PROVIDER TYPES
 * 
 * Defines the contract for LLM providers used in interpretation generation.
 */

export type LLMErrorCode =
    | 'TIMEOUT'
    | 'RATE_LIMIT'
    | 'INVALID_JSON'
    | 'POLICY_REJECTED'
    | 'PROVIDER_ERROR'
    | 'DISABLED'
    | 'MISSING_KEY';

export interface LLMError {
    code: LLMErrorCode;
    message: string;
    retryable: boolean;
    provider: string;
    model: string | null;
}

export interface LLMSuccess<T> {
    ok: true;
    json: T;
    raw: string;
    usage?: {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
    };
    model: string;
    provider: string;
}

export interface LLMFailure {
    ok: false;
    error: LLMError;
    raw?: string;
}

export type LLMResult<T> = LLMSuccess<T> | LLMFailure;

export interface LLMProvider {
    /**
     * Generate structured JSON from a prompt.
     * Enforces strict schema compliance via system prompt and validation.
     * 
     * @param systemPrompt Instructions and schema definition
     * @param userPrompt The actual input data to process
     * @param modelOverride Optional model override
     */
    generateJSON<T>(
        systemPrompt: string,
        userPrompt: string,
        modelOverride?: string
    ): Promise<LLMResult<T>>;
}

/**
 * Legacy/Brief Types
 * Required for components/admin/teamlead/BriefPanel.tsx
 */
export interface BriefOutput {
    headline: string;
    state_summary: string;
    trend_summary: string;
    top_drivers: Array<{ name: string; scope: string; why_it_matters: string }>;
    influence_actions: Array<{ scope: string; action_title: string; steps: string[] }>;
    confidence_statement: string;
    risks_and_watchouts: string[];
    citations: Array<{ source: string; fields_used: string[] }>;
}

export interface GeneratedInteraction {
    type: 'rating' | 'choice' | 'text';
    prompt_text: string;
    construct?: string;
    targets?: string[];
    response_spec?: {
        min_label?: string;
        max_label?: string;
        choices?: Array<{ label: string; coding: any[] }>;
        guidance?: string;
        option_codes?: Record<string, any[]>;
    };
    psych_rationale?: string;
}

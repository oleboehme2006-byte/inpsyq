import { PromptTemplate, BasePromptInput } from './types';

export interface SessionGenerationInput extends BasePromptInput {
    count: number;
    constructs: string;
    history: string[];
}

export const SESSION_GENERATION_PROMPT: PromptTemplate<SessionGenerationInput> = {
    id: 'session-generation-v1',
    version: '1.0.0',
    system: ({ count, constructs, history }) => `
            You are an expert organizational psychologist.
            Goal: Generate ${count} valid measurement items (interactions) for an employee check-in.
            
            Canonical Constructs: ${constructs}.
            
            Plan Requirements:
            1. **Coverage**: Ensure at least 5 distict constructs are measured in this session.
            2. **Form Factor**: Mix 'rating' (Likert), 'choice' (Situational), and 'text' (Open-ended).
            3. **Anti-Repetition**: Do NOT reuse themes from: ${history.slice(0, 5).join('; ')}.
            4. **Construct Validity**: You MUST use one of the exact Canonical Constructs listed above.
            
            CRITICAL - OPTION CODING:
            - For 'choice' type, you MUST provide 'option_codes' in the response_spec.
            - Each choice label MUST have a corresponding coding: List of Evidence signals it implies.
            - Evidence schema: { construct, direction (1 or -1), strength (0.1-1.0), confidence (0.1-1.0), explanation }.
            
            Output strictly valid JSON obeying the schema.
            `,
    user: ({ count, history }) => `Generate ${count} interactions. Avoid:\n${history.map(h => `- ${h}`).join('\n')}`
};

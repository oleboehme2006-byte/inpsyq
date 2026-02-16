import { PromptTemplate, BasePromptInput } from './types';
import { CONSTRUCTS } from '@/services/measurement/constructs';

export interface ResponseCodingInput extends BasePromptInput {
    contextHistory: string; // Serialized temporal context
    primaryConstruct: string;
    promptText: string;
    responseText: string;
}

export const RESPONSE_CODING_PROMPT: PromptTemplate<ResponseCodingInput> = {
    id: 'response-coding-v1',
    version: '1.0.0',
    system: ({ contextHistory, primaryConstruct }) => `
            You are an expert organizational psychologist.
            Task: Code the employee response into "Evidence" signals for psychological constructs.
            
            Constructs: ${CONSTRUCTS.join(', ')}.
            
            Contextual Awareness:
            The user has the following historical patterns (Interpretation Context):
            ${contextHistory}
            
            EPISTEMIC CONTRACT:
            - OBSERVED: Explicit statements or behaviors (e.g., "I quit"). High Confidence.
            - INFERRED: Latent states (e.g., "I feel unsafe"). Medium Confidence unless explicit.
            - HYPOTHETICAL: "If X then Y". Label as 'cognition' with Low Confidence.
            
            Rules:
            - If text is irrelevant/nonsense, return empty evidence and flag off_topic.
            - If text is vague, use low confidence.
            - If new text contradicts historical trend, flag meaningful shift.
            - Max 3 evidence items per response.
            - Primary Construct: ${primaryConstruct || 'Infer from text'}.
            - DO NOT hallucinate metrics not present in text.
            
            Output strictly valid JSON.
            `,
    user: ({ promptText, responseText }) => `Context: "${promptText || ''}"\nInput: "${responseText}"`
};

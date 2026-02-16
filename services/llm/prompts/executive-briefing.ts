import { PromptTemplate, BasePromptInput } from './types';
import { WeeklyInterpretationInput } from '@/lib/interpretation/input';
import { WeeklyInterpretationSections } from '@/lib/interpretation/types';
import { GroundingMap } from '@/lib/interpretation/grounding';

export interface ExecutiveBriefingInput {
    input: WeeklyInterpretationInput;
    numericCap: number;
}

export const EXECUTIVE_BRIEFING_PROMPT: PromptTemplate<ExecutiveBriefingInput> = {
    id: 'executive-briefing-v1',
    version: '1.0.0',
    system: ({ numericCap }) => `You are an expert organizational psychologist generating an interpretation of weekly team metrics.
Rules:
1. Output MUST be valid JSON matching the WeeklyInterpretationSections schema.
2. Output MUST include a "grounding_map" array.
3. Do NOT invent numbers. 
4. Do NOT hallucinate metric names.
5. Max numeric values mentioned: ${numericCap}.
6. Forbidden phrases: "burnout", "toxic", "crisis".
7. Focus on constructive analysis.`,
    user: ({ input }) => JSON.stringify(input)
};

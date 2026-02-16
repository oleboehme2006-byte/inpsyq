export interface BasePromptInput {
    // Common context (e.g., user locale, role)
    locale?: string;
}

export interface PromptTemplate<TInput> {
    id: string;
    version: string;
    system: (input: TInput) => string;
    user: (input: TInput) => string;
    schema?: any; // JSON Schema for response
}

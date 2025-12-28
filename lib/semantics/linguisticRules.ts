/**
 * LINGUISTIC RULES — Enforceable Language Constraints
 * 
 * Defines strict language boundaries for each index to prevent:
 * - Nonsensical text generation
 * - Contradictory explanations
 * - Psychologically incorrect phrasing
 * 
 * PURPOSE:
 * - Prepare safe boundaries for future LLM use
 * - Enforce consistency across all interpretation layers
 * - This file contains NO UI text, only CONSTRAINTS
 */

import { IndexId } from './indexRegistry';

// ============================================================================
// Types
// ============================================================================

export interface LinguisticRuleSet {
    readonly indexId: IndexId;
    /** Adjectives that are semantically valid for this index */
    readonly allowedAdjectives: readonly string[];
    /** Phrases that must NEVER appear in explanations for this index */
    readonly forbiddenPhrases: readonly string[];
    /** Safe fallback phrases when generation is uncertain */
    readonly neutralFallbackPhrases: readonly string[];
}

// ============================================================================
// Registry
// ============================================================================

export const LINGUISTIC_RULES: Readonly<Record<IndexId, LinguisticRuleSet>> = {
    strain: {
        indexId: 'strain',
        allowedAdjectives: [
            'minimal',
            'low',
            'moderate',
            'elevated',
            'high',
            'severe',
            'critical',
            'accumulating',
            'increasing',
            'decreasing',
            'stable',
            'chronic',
            'acute',
            'persistent',
            'manageable',
            'unsustainable',
        ],
        forbiddenPhrases: [
            'positive strain',
            'healthy strain',
            'productive strain',
            'optimal strain',
            'good stress',
            'beneficial load',
            'strain is normal', // Normalizing can be harmful
            'just stress',
            'temporary discomfort', // Minimizing
            'acceptable strain levels', // Value judgment without context
        ],
        neutralFallbackPhrases: [
            'Strain levels require monitoring.',
            'Current strain metrics are being tracked.',
            'Strain data is available for review.',
        ],
    },

    withdrawal_risk: {
        indexId: 'withdrawal_risk',
        allowedAdjectives: [
            'minimal',
            'low',
            'moderate',
            'elevated',
            'high',
            'severe',
            'acute',
            'increasing',
            'decreasing',
            'stable',
            'emerging',
            'persistent',
        ],
        forbiddenPhrases: [
            'healthy withdrawal',
            'positive disengagement',
            'strategic withdrawal',
            'good attrition',
            'natural turnover',
            'acceptable churn',
            'just leaving', // Minimizing
            'normal departures',
            'expected exits',
        ],
        neutralFallbackPhrases: [
            'Withdrawal risk signals are being monitored.',
            'Current risk indicators are available for review.',
            'Withdrawal risk data continues to be collected.',
        ],
    },

    trust_gap: {
        indexId: 'trust_gap',
        allowedAdjectives: [
            'minimal',
            'low',
            'moderate',
            'significant',
            'substantial',
            'severe',
            'widening',
            'narrowing',
            'stable',
            'persistent',
            'growing',
            'shrinking',
        ],
        forbiddenPhrases: [
            'healthy distrust',
            'productive skepticism',
            'good gap',
            'positive mistrust',
            'natural suspicion',
            'expected gap',
            'just miscommunication', // Minimizing
            'trust issues are normal',
            'everyone has trust gaps',
        ],
        neutralFallbackPhrases: [
            'Trust gap metrics continue to be tracked.',
            'Current trust alignment data is available.',
            'Trust gap signals are being monitored.',
        ],
    },

    engagement: {
        indexId: 'engagement',
        allowedAdjectives: [
            'minimal',
            'low',
            'moderate',
            'strong',
            'high',
            'exceptional',
            'improving',
            'declining',
            'stable',
            'sustained',
            'fluctuating',
            'robust',
        ],
        forbiddenPhrases: [
            'excessive engagement', // Workaholism is a different construct
            'dangerous engagement',
            'unhealthy dedication',
            'toxic engagement',
            'too engaged',
            'overly committed',
            'obsessive engagement',
            'engagement addiction',
        ],
        neutralFallbackPhrases: [
            'Engagement levels are being tracked.',
            'Current engagement metrics are available for review.',
            'Engagement data continues to be collected.',
        ],
    },
} as const;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if an adjective is allowed for a given index.
 */
export function isAdjectiveAllowed(indexId: IndexId, adjective: string): boolean {
    const rules = LINGUISTIC_RULES[indexId];
    if (!rules) return false;
    return rules.allowedAdjectives.includes(adjective.toLowerCase());
}

/**
 * Check if a phrase is forbidden for a given index.
 * Returns true if the text contains ANY forbidden phrase.
 */
export function containsForbiddenPhrase(indexId: IndexId, text: string): boolean {
    const rules = LINGUISTIC_RULES[indexId];
    if (!rules) return false;

    const lowerText = text.toLowerCase();
    return rules.forbiddenPhrases.some(phrase =>
        lowerText.includes(phrase.toLowerCase())
    );
}

/**
 * Validate that generated text does not violate linguistic rules.
 * Throws if forbidden phrases are detected.
 */
export function validateGeneratedText(indexId: IndexId, text: string): void {
    const rules = LINGUISTIC_RULES[indexId];
    if (!rules) {
        throw new Error(`No linguistic rules defined for index "${indexId}"`);
    }

    const lowerText = text.toLowerCase();
    for (const phrase of rules.forbiddenPhrases) {
        if (lowerText.includes(phrase.toLowerCase())) {
            throw new Error(
                `LINGUISTIC VIOLATION: Text for index "${indexId}" contains forbidden phrase: "${phrase}". ` +
                `Text: "${text.substring(0, 100)}..."`
            );
        }
    }
}

/**
 * Get a safe fallback phrase when text generation is uncertain.
 */
export function getNeutralFallback(indexId: IndexId): string {
    const rules = LINGUISTIC_RULES[indexId];
    if (!rules || rules.neutralFallbackPhrases.length === 0) {
        return 'Data is available for review.';
    }
    // Always return first fallback for determinism
    return rules.neutralFallbackPhrases[0];
}

/**
 * Get all allowed adjectives for an index.
 */
export function getAllowedAdjectives(indexId: IndexId): readonly string[] {
    const rules = LINGUISTIC_RULES[indexId];
    if (!rules) {
        throw new Error(`No linguistic rules defined for index "${indexId}"`);
    }
    return rules.allowedAdjectives;
}

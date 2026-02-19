/**
 * INTERPRETATION VALIDATION — Strict Output Validation
 * 
 * All validators run before writing to DB.
 * Fail with explicit error codes.
 */

import {
    WeeklyInterpretationSections,
    SECTION_LIMITS,
    MAX_EXPLICIT_NUMBERS
} from './types';
import { WeeklyInterpretationInput } from './input';
import { PolicyResult } from './policy';
import { INDEX_REGISTRY, IndexId } from '@/lib/semantics/indexRegistry';
import { DRIVER_REGISTRY, DriverFamilyId, isValidDriverFamilyId } from '@/lib/semantics/driverRegistry';

// Forbidden phrases that must never appear in LLM-generated content
const FORBIDDEN_PHRASES = [
    'burnout', 'toxic', 'crisis', 'mental health disorder',
    'psychological disorder', 'mentally ill', 'suicidal',
];

// ============================================================================
// Validation Errors
// ============================================================================

export class InterpretationValidationError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'InterpretationValidationError';
    }
}

// ============================================================================
// Shape Validation
// ============================================================================

export function validateSectionsShape(sections: any): WeeklyInterpretationSections {
    const errors: string[] = [];

    // Check required fields
    if (typeof sections.executiveSummary !== 'string') {
        errors.push('executiveSummary must be a string');
    }
    if (!Array.isArray(sections.whatChanged)) {
        errors.push('whatChanged must be an array');
    }
    if (!sections.primaryDrivers || typeof sections.primaryDrivers !== 'object') {
        errors.push('primaryDrivers must be an object');
    }
    if (!Array.isArray(sections.riskOutlook)) {
        errors.push('riskOutlook must be an array');
    }
    if (!Array.isArray(sections.recommendedFocus)) {
        errors.push('recommendedFocus must be an array');
    }
    if (typeof sections.confidenceAndLimits !== 'string') {
        errors.push('confidenceAndLimits must be a string');
    }

    if (errors.length > 0) {
        throw new InterpretationValidationError(
            'Invalid sections shape',
            'INVALID_SHAPE',
            { errors }
        );
    }

    // Validate limits
    const wordCount = (s: string) => s.trim().split(/\s+/).filter(w => w.length > 0).length;

    const summaryWords = wordCount(sections.executiveSummary);
    if (summaryWords < SECTION_LIMITS.executiveSummary.minWords ||
        summaryWords > SECTION_LIMITS.executiveSummary.maxWords) {
        errors.push(`executiveSummary: ${summaryWords} words (expect ${SECTION_LIMITS.executiveSummary.minWords}-${SECTION_LIMITS.executiveSummary.maxWords})`);
    }

    if (sections.whatChanged.length > SECTION_LIMITS.whatChanged.maxItems) {
        errors.push(`whatChanged: ${sections.whatChanged.length} items (max ${SECTION_LIMITS.whatChanged.maxItems})`);
    }

    for (let i = 0; i < sections.whatChanged.length; i++) {
        const bulletWords = wordCount(sections.whatChanged[i]);
        if (bulletWords > SECTION_LIMITS.whatChanged.maxWordsPerItem) {
            errors.push(`whatChanged[${i}]: ${bulletWords} words (max ${SECTION_LIMITS.whatChanged.maxWordsPerItem})`);
        }
    }

    // Validate Phase 9 optional fields if present
    if (sections.driverCards !== undefined) {
        if (!Array.isArray(sections.driverCards)) {
            errors.push('driverCards must be an array');
        } else {
            if (sections.driverCards.length > SECTION_LIMITS.driverCards.maxItems) {
                errors.push(`driverCards: ${sections.driverCards.length} items (max ${SECTION_LIMITS.driverCards.maxItems})`);
            }
            sections.driverCards.forEach((card: any, i: number) => {
                if (!card.driverFamily || typeof card.driverFamily !== 'string') {
                    errors.push(`driverCards[${i}]: missing driverFamily`);
                }
                if (!card.label || typeof card.label !== 'string') {
                    errors.push(`driverCards[${i}]: missing label`);
                }
                if (!card.mechanism || typeof card.mechanism !== 'string') {
                    errors.push(`driverCards[${i}]: missing mechanism`);
                }
                if (!card.recommendation || typeof card.recommendation !== 'string') {
                    errors.push(`driverCards[${i}]: missing recommendation`);
                }
            });
        }
    }

    if (sections.actionCards !== undefined) {
        if (!Array.isArray(sections.actionCards)) {
            errors.push('actionCards must be an array');
        } else {
            if (sections.actionCards.length > SECTION_LIMITS.actionCards.maxItems) {
                errors.push(`actionCards: ${sections.actionCards.length} items (max ${SECTION_LIMITS.actionCards.maxItems})`);
            }
            sections.actionCards.forEach((card: any, i: number) => {
                if (!card.title || typeof card.title !== 'string') {
                    errors.push(`actionCards[${i}]: missing title`);
                }
                if (!['critical', 'warning', 'info'].includes(card.severity)) {
                    errors.push(`actionCards[${i}]: invalid severity "${card.severity}"`);
                }
                if (!['HIGH', 'AT RISK', 'LOW'].includes(card.criticality)) {
                    errors.push(`actionCards[${i}]: invalid criticality "${card.criticality}"`);
                }
            });
        }
    }

    if (sections.briefingParagraphs !== undefined) {
        if (!Array.isArray(sections.briefingParagraphs)) {
            errors.push('briefingParagraphs must be an array');
        } else {
            if (sections.briefingParagraphs.length > SECTION_LIMITS.briefingParagraphs.maxItems) {
                errors.push(`briefingParagraphs: ${sections.briefingParagraphs.length} items (max ${SECTION_LIMITS.briefingParagraphs.maxItems})`);
            }
        }
    }

    if (errors.length > 0) {
        throw new InterpretationValidationError(
            'Section limits exceeded',
            'LIMITS_EXCEEDED',
            { errors }
        );
    }

    return sections as WeeklyInterpretationSections;
}

// ============================================================================
// Grounding Validation (No Invention)
// ============================================================================

export function validateNoInvention(
    sections: WeeklyInterpretationSections,
    input: WeeklyInterpretationInput
): void {
    const errors: string[] = [];

    // Known index names
    const knownIndexNames = new Set<string>();
    Object.values(INDEX_REGISTRY).forEach(idx => {
        knownIndexNames.add(idx.id);
        knownIndexNames.add(idx.displayName.toLowerCase());
    });
    input.indices.forEach(idx => {
        knownIndexNames.add(idx.indexId);
        knownIndexNames.add(idx.qualitativeState.toLowerCase());
    });

    // Known driver names
    const knownDriverNames = new Set<string>();
    Object.values(DRIVER_REGISTRY).forEach(d => {
        knownDriverNames.add(d.id);
        knownDriverNames.add(d.displayName.toLowerCase());
    });
    input.attribution.internalDrivers.forEach(d => {
        knownDriverNames.add(d.driverFamily);
        knownDriverNames.add(d.label.toLowerCase());
    });

    // Known dependency names
    const knownDependencies = new Set<string>();
    input.attribution.externalDependencies.forEach(d => {
        knownDependencies.add(d.dependency.toLowerCase());
    });

    // Check primary drivers
    sections.primaryDrivers.internal.forEach((d, i) => {
        const labelLower = d.label.toLowerCase();
        if (!knownDriverNames.has(labelLower) && !knownDriverNames.has(d.label)) {
            // Allow if it's a known driver family
            const familyMatch = Array.from(knownDriverNames).some(n => labelLower.includes(n));
            if (!familyMatch) {
                errors.push(`Unknown internal driver: "${d.label}"`);
            }
        }
    });

    sections.primaryDrivers.external.forEach((d, i) => {
        const labelLower = d.label.toLowerCase();
        if (!knownDependencies.has(labelLower) && knownDependencies.size > 0) {
            // Allow generic external labels if we have no specific dependencies
            if (knownDependencies.size > 0) {
                const depMatch = Array.from(knownDependencies).some(n => labelLower.includes(n));
                if (!depMatch) {
                    errors.push(`Unknown external dependency: "${d.label}"`);
                }
            }
        }
    });

    if (errors.length > 0) {
        throw new InterpretationValidationError(
            'Interpretation references unknown entities',
            'UNKNOWN_ENTITIES',
            { errors }
        );
    }
}

// ============================================================================
// Numeric Spam Validation
// ============================================================================

export function validateNumericSpam(sections: WeeklyInterpretationSections): void {
    // Count explicit numbers in all text (including Phase 9 fields)
    const allText = [
        sections.executiveSummary,
        ...sections.whatChanged,
        ...sections.riskOutlook,
        ...sections.recommendedFocus,
        sections.confidenceAndLimits,
        ...(sections.driverCards || []).flatMap(c => [c.mechanism, c.causality, c.effects, c.recommendation]),
        ...(sections.actionCards || []).flatMap(c => [c.message, c.context, c.rationale, c.effects, c.recommendation]),
        ...(sections.briefingParagraphs || []),
    ].join(' ');

    // Match numbers (including percentages)
    const numbers = allText.match(/\d+(\.\d+)?%?/g) || [];

    if (numbers.length > MAX_EXPLICIT_NUMBERS) {
        throw new InterpretationValidationError(
            `Too many explicit numbers: ${numbers.length} (max ${MAX_EXPLICIT_NUMBERS})`,
            'NUMERIC_SPAM',
            { count: numbers.length, max: MAX_EXPLICIT_NUMBERS, found: numbers }
        );
    }

    // Validate forbidden phrases across all text
    const lowerText = allText.toLowerCase();
    const foundForbidden = FORBIDDEN_PHRASES.filter(phrase => lowerText.includes(phrase));
    if (foundForbidden.length > 0) {
        throw new InterpretationValidationError(
            `Forbidden phrases detected: ${foundForbidden.join(', ')}`,
            'FORBIDDEN_PHRASE',
            { found: foundForbidden }
        );
    }
}

// ============================================================================
// Policy Compliance Validation
// ============================================================================

export function validatePolicyCompliance(
    sections: WeeklyInterpretationSections,
    input: WeeklyInterpretationInput,
    policy: PolicyResult
): void {
    const errors: string[] = [];

    // Check max recommended focus
    if (sections.recommendedFocus.length > policy.maxRecommendedFocus) {
        errors.push(`recommendedFocus: ${sections.recommendedFocus.length} items (max ${policy.maxRecommendedFocus} per policy: ${policy.reason})`);
    }

    // Check monitor-only
    if (policy.monitorOnly && sections.recommendedFocus.length > 1) {
        const hasMonitorOnly = sections.recommendedFocus.length === 1 &&
            sections.recommendedFocus[0].toLowerCase().includes('monitor');
        if (!hasMonitorOnly) {
            errors.push(`Policy requires monitor-only but got actionable items`);
        }
    }

    if (errors.length > 0) {
        throw new InterpretationValidationError(
            'Policy compliance failed',
            'POLICY_VIOLATION',
            { errors, policy }
        );
    }
}

// ============================================================================
// Combined Validation
// ============================================================================

export function validateAll(
    sections: any,
    input: WeeklyInterpretationInput,
    policy: PolicyResult
): WeeklyInterpretationSections {
    const validated = validateSectionsShape(sections);
    validateNoInvention(validated, input);
    validateNumericSpam(validated);
    validatePolicyCompliance(validated, input, policy);
    return validated;
}

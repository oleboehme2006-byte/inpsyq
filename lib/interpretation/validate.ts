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
import { DRIVER_REGISTRY, DriverFamilyId } from '@/lib/semantics/driverRegistry';

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
    // Count explicit numbers in all text
    const allText = [
        sections.executiveSummary,
        ...sections.whatChanged,
        ...sections.riskOutlook,
        ...sections.recommendedFocus,
        sections.confidenceAndLimits,
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

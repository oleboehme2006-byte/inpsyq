/**
 * INTERPRETATION HASH — Canonical Hashing for Idempotency
 * 
 * Mirrors Phase 6 hashing approach.
 */

import { createHash } from 'crypto';
import { WeeklyInterpretationInput } from './input';

/**
 * Canonicalize input for hashing (sorted keys, stable JSON).
 */
export function canonicalizeInterpretationInput(input: WeeklyInterpretationInput): string {
    return canonicalJSON(input);
}

/**
 * Compute SHA-256 hash of interpretation input.
 */
export function computeInterpretationHash(input: WeeklyInterpretationInput): string {
    const canonical = canonicalizeInterpretationInput(input);
    return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Stable JSON with sorted keys.
 */
function canonicalJSON(obj: any): string {
    return JSON.stringify(obj, (key, value) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return Object.keys(value).sort().reduce((sorted: any, k) => {
                sorted[k] = value[k];
                return sorted;
            }, {});
        }
        return value;
    });
}

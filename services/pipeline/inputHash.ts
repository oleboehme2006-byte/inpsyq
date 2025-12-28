/**
 * INPUT HASH — Canonical JSON + SHA-256 Hashing
 * 
 * Creates deterministic input hashes for idempotency.
 */

import { createHash } from 'crypto';
import { CanonicalInputData } from './types';

/**
 * Create a canonical JSON string with sorted keys.
 */
function canonicalJSON(obj: unknown): string {
    return JSON.stringify(obj, (key, value) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return Object.keys(value)
                .sort()
                .reduce((sorted: Record<string, unknown>, k) => {
                    sorted[k] = value[k];
                    return sorted;
                }, {});
        }
        return value;
    });
}

/**
 * Compute SHA-256 hash of canonical input data.
 */
export function computeInputHash(input: CanonicalInputData): string {
    const canonical = canonicalJSON(input);
    return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}

/**
 * Create canonical input data from raw measurements.
 */
export function buildCanonicalInput(
    orgId: string,
    teamId: string,
    weekStartISO: string,
    userMeasurements: Array<{
        userId: string;
        parameterMeans: Record<string, number>;
        parameterVariance: Record<string, number>;
        sessionCount: number;
    }>
): CanonicalInputData {
    // Sort users by userId for determinism
    const sortedMeasurements = [...userMeasurements]
        .sort((a, b) => a.userId.localeCompare(b.userId))
        .map(m => ({
            userId: m.userId,
            parameterMeans: sortObject(m.parameterMeans),
            parameterVariance: sortObject(m.parameterVariance),
            sessionCount: m.sessionCount,
        }));

    return {
        orgId,
        teamId,
        weekStartISO,
        userMeasurements: sortedMeasurements,
    };
}

function sortObject(obj: Record<string, number>): Record<string, number> {
    return Object.keys(obj)
        .sort()
        .reduce((sorted: Record<string, number>, key) => {
            sorted[key] = obj[key];
            return sorted;
        }, {});
}

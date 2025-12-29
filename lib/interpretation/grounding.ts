/**
 * INTERPRETATION GROUNDING
 * 
 * Enforces strict grounding of LLM claims in canonical input data.
 * Every claim must cite a JSON path that exists in the input.
 */

import { WeeklyInterpretationInput } from './input';

export interface GroundingSource {
    path: string; // JSONPath-like string, e.g., "$.indices.strain.current.value"
    value?: any;  // Optional: the specific value retrieved (for audit)
}

export interface GroundingEntry {
    claimId: string;
    claimText: string;
    sources: string[]; // List of paths
}

export type GroundingMap = GroundingEntry[];

/**
 * Validates that all sources in the grounding map exist in the input.
 * Throws error if any path is invalid or missing.
 */
export function assertGroundingMap(
    map: GroundingMap,
    input: WeeklyInterpretationInput
): void {
    if (!Array.isArray(map)) {
        throw new Error('Grounding map must be an array');
    }

    for (const entry of map) {
        if (!entry.claimText || !Array.isArray(entry.sources)) {
            throw new Error(`Invalid grounding entry: ${JSON.stringify(entry)}`);
        }

        for (const path of entry.sources) {
            if (!pathExistsInInput(path, input)) {
                throw new Error(`Grounding failure: Path '${path}' not found in input for claim: "${entry.claimText}"`);
            }
        }
    }
}

/**
 * Checks if a simplified JSON path exists in the object.
 * Supports dot notation and array indexing [n].
 * Example: $.indices.strain.current.value
 */
function pathExistsInInput(path: string, input: any): boolean {
    // Remove leading $. if present
    const cleanPath = path.startsWith('$.') ? path.slice(2) : path;
    const parts = cleanPath.split('.').filter(p => p.length > 0);

    let current = input;
    for (const part of parts) {
        if (current === null || current === undefined) return false;

        // Handle array index: internal[0]
        const arrayMatch = part.match(/^(.*)\[(\d+)\]$/);
        if (arrayMatch) {
            const key = arrayMatch[1];
            const index = parseInt(arrayMatch[2], 10);

            // Access key first if it exists (e.g., 'internal' in 'internal[0]')
            if (key) {
                current = current[key];
            }

            if (!Array.isArray(current) || current.length <= index) {
                return false;
            }
            current = current[index];
        } else {
            // Normal property
            if (!(part in current)) {
                return false;
            }
            current = current[part];
        }
    }

    return current !== undefined;
}

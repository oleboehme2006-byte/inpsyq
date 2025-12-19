/**
 * API Validation Utilities
 * Strict input validation for production robustness.
 */

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    return UUID_REGEX.test(value);
}

export function generateRequestId(): string {
    // Simple UUID v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export interface ValidationError {
    error: string;
    code: string;
    field?: string;
    request_id: string;
}

export function createValidationError(field: string, message: string, requestId: string): ValidationError {
    return {
        error: message,
        code: 'INVALID_' + field.toUpperCase(),
        field,
        request_id: requestId,
    };
}

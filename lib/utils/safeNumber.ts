/**
 * Safe Numeric Utilities
 * Prevents runtime crashes (e.g., undefined.toFixed) when dealing with
 * optional, nullable, or delayed numeric signals.
 * 
 * Rules:
 * - Accept unknown/undefined/null
 * - Never throw
 * - Default deterministically
 */

/**
 * Safely converts any value to a number.
 * If strictly invalid/NaN/null/undefined, returns the fallback.
 */
export function safeNumber(value: any, fallback: number = 0): number {
    if (value === null || value === undefined) return fallback;
    const num = Number(value);
    return isNaN(num) ? fallback : num;
}

/**
 * Safely formats a number to fixed decimal places.
 * Returns string representation.
 */
export function safeToFixed(value: any, digits = 2, fallback = '0.00'): string {
    if (value === null || value === undefined) return fallback;
    const num = Number(value);
    if (isNaN(num)) return fallback;
    try {
        return num.toFixed(digits);
    } catch (e) {
        return fallback;
    }
}

/**
 * Safely formats a value as a percentage string (e.g. "85%").
 */
export function safePercent(value: any, digits = 0): string {
    if (value === null || value === undefined) return '0%';
    const num = Number(value);
    if (isNaN(num)) return '0%';
    try {
        return `${(num * 100).toFixed(digits)}%`;
    } catch (e) {
        return '0%';
    }
}

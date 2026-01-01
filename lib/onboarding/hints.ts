/**
 * Progressive Disclosure Types and Utilities
 * 
 * Provides types for dismissible hints that don't alter UI structure.
 * Hints are stored in localStorage for persistence.
 */

export interface Hint {
    id: string;
    content: string;
    dismissible: boolean;
}

export interface HintState {
    dismissed: Set<string>;
}

const STORAGE_KEY = 'inpsyq_dismissed_hints';

/**
 * Get dismissed hint IDs from localStorage.
 */
export function getDismissedHints(): Set<string> {
    if (typeof window === 'undefined') return new Set();

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return new Set(JSON.parse(stored));
        }
    } catch {
        // Ignore parse errors
    }
    return new Set();
}

/**
 * Dismiss a hint by ID.
 */
export function dismissHint(hintId: string): void {
    if (typeof window === 'undefined') return;

    const dismissed = getDismissedHints();
    dismissed.add(hintId);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(dismissed)));
    } catch {
        // Ignore storage errors
    }
}

/**
 * Check if a hint should be shown.
 */
export function shouldShowHint(hint: Hint, dismissed: Set<string>): boolean {
    if (!hint.dismissible) return true;
    return !dismissed.has(hint.id);
}

/**
 * Reset all dismissed hints (for testing or settings).
 */
export function resetHints(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get contextual hint based on data state.
 */
export function getContextualHint(params: {
    status: 'OK' | 'DEGRADED' | 'FAILED';
    hasActions: boolean;
    driverSource: 'INTERNAL' | 'EXTERNAL' | 'MIXED' | null;
}): Hint | null {
    const { status, hasActions, driverSource } = params;

    // Priority: action absence > external dominance > high strain
    if (!hasActions && status !== 'FAILED') {
        return {
            id: 'empty-actions',
            content: 'No actions means metrics are within normal ranges.',
            dismissible: true,
        };
    }

    if (driverSource === 'EXTERNAL') {
        return {
            id: 'ext-dominant',
            content: 'External factors are primary. Internal action may be limited.',
            dismissible: true,
        };
    }

    if (status === 'DEGRADED') {
        return {
            id: 'degraded-state',
            content: 'Some data is pending. Insights may be incomplete.',
            dismissible: true,
        };
    }

    return null;
}

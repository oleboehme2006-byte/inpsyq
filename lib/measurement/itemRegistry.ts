/**
 * MEASUREMENT ITEM REGISTRY — Canonical Measurement Items
 * 
 * Defines all valid measurement items with strict typing.
 * Items are validated at runtime. Invalid usage throws immediately.
 * 
 * NO free-text items.
 * NO dynamic item creation.
 */

import { IndexId, isValidIndexId } from '@/lib/semantics/indexRegistry';
import { DriverFamilyId, isValidDriverFamilyId } from '@/lib/semantics/driverRegistry';

// ============================================================================
// Types
// ============================================================================

export type ScaleType = 'LIKERT_5' | 'LIKERT_7' | 'BINARY' | 'NUMERIC_0_10';

export type Direction = 'HIGHER_IS_WORSE' | 'HIGHER_IS_BETTER';

export interface MeasurementItem {
    readonly itemId: string;
    readonly label: string;
    readonly scaleType: ScaleType;
    readonly minValue: number;
    readonly maxValue: number;
    readonly direction: Direction;
    readonly associatedIndex: IndexId;
    readonly driverFamily: DriverFamilyId;
    readonly required: boolean;
}

// ============================================================================
// Scale Definitions
// ============================================================================

export const SCALE_BOUNDS: Record<ScaleType, { min: number; max: number }> = {
    LIKERT_5: { min: 1, max: 5 },
    LIKERT_7: { min: 1, max: 7 },
    BINARY: { min: 0, max: 1 },
    NUMERIC_0_10: { min: 0, max: 10 },
};

// ============================================================================
// Item Registry
// ============================================================================

export const ITEM_REGISTRY: Readonly<Record<string, MeasurementItem>> = {
    // Strain-related items
    workload_volume: {
        itemId: 'workload_volume',
        label: 'My workload is manageable',
        scaleType: 'LIKERT_5',
        minValue: 1,
        maxValue: 5,
        direction: 'HIGHER_IS_BETTER',
        associatedIndex: 'strain',
        driverFamily: 'cognitive_load',
        required: true,
    },
    mental_exhaustion: {
        itemId: 'mental_exhaustion',
        label: 'I feel mentally drained at the end of the day',
        scaleType: 'LIKERT_5',
        minValue: 1,
        maxValue: 5,
        direction: 'HIGHER_IS_WORSE',
        associatedIndex: 'strain',
        driverFamily: 'emotional_load',
        required: true,
    },
    role_clarity: {
        itemId: 'role_clarity',
        label: 'I understand what is expected of me',
        scaleType: 'LIKERT_5',
        minValue: 1,
        maxValue: 5,
        direction: 'HIGHER_IS_BETTER',
        associatedIndex: 'strain',
        driverFamily: 'role_conflict',
        required: true,
    },

    // Withdrawal Risk items
    job_search_intent: {
        itemId: 'job_search_intent',
        label: 'I have thought about looking for a new job',
        scaleType: 'LIKERT_5',
        minValue: 1,
        maxValue: 5,
        direction: 'HIGHER_IS_WORSE',
        associatedIndex: 'withdrawal_risk',
        driverFamily: 'emotional_load',
        required: true,
    },
    effort_discretionary: {
        itemId: 'effort_discretionary',
        label: 'I go above and beyond what is required',
        scaleType: 'LIKERT_5',
        minValue: 1,
        maxValue: 5,
        direction: 'HIGHER_IS_BETTER',
        associatedIndex: 'withdrawal_risk',
        driverFamily: 'autonomy_friction',
        required: true,
    },

    // Trust Gap items
    leadership_trust: {
        itemId: 'leadership_trust',
        label: 'I trust the decisions made by leadership',
        scaleType: 'LIKERT_5',
        minValue: 1,
        maxValue: 5,
        direction: 'HIGHER_IS_BETTER',
        associatedIndex: 'trust_gap',
        driverFamily: 'social_safety',
        required: true,
    },
    peer_support: {
        itemId: 'peer_support',
        label: 'My colleagues support me when needed',
        scaleType: 'LIKERT_5',
        minValue: 1,
        maxValue: 5,
        direction: 'HIGHER_IS_BETTER',
        associatedIndex: 'trust_gap',
        driverFamily: 'social_safety',
        required: true,
    },
    communication_clarity: {
        itemId: 'communication_clarity',
        label: 'Communication from leadership is clear',
        scaleType: 'LIKERT_5',
        minValue: 1,
        maxValue: 5,
        direction: 'HIGHER_IS_BETTER',
        associatedIndex: 'trust_gap',
        driverFamily: 'alignment_clarity',
        required: true,
    },

    // Engagement items
    work_meaning: {
        itemId: 'work_meaning',
        label: 'My work feels meaningful',
        scaleType: 'LIKERT_5',
        minValue: 1,
        maxValue: 5,
        direction: 'HIGHER_IS_BETTER',
        associatedIndex: 'engagement',
        driverFamily: 'alignment_clarity',
        required: true,
    },
    autonomy_level: {
        itemId: 'autonomy_level',
        label: 'I have enough autonomy in how I do my work',
        scaleType: 'LIKERT_5',
        minValue: 1,
        maxValue: 5,
        direction: 'HIGHER_IS_BETTER',
        associatedIndex: 'engagement',
        driverFamily: 'autonomy_friction',
        required: true,
    },
} as const;

// ============================================================================
// Validation & Helpers
// ============================================================================

/**
 * Get item by ID. Throws if not found.
 */
export function getItem(itemId: string): MeasurementItem {
    const item = ITEM_REGISTRY[itemId];
    if (!item) {
        throw new Error(`[ItemRegistry] Item "${itemId}" not found`);
    }
    return item;
}

/**
 * Validate a response value for an item.
 */
export function validateItemValue(itemId: string, value: number): void {
    const item = getItem(itemId);

    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`[ItemRegistry] Value must be a number for item "${itemId}"`);
    }

    if (value < item.minValue || value > item.maxValue) {
        throw new Error(
            `[ItemRegistry] Value ${value} out of range [${item.minValue}, ${item.maxValue}] for item "${itemId}"`
        );
    }

    // Integer check for Likert/Binary scales
    if (item.scaleType !== 'NUMERIC_0_10' && !Number.isInteger(value)) {
        throw new Error(`[ItemRegistry] Value must be integer for item "${itemId}"`);
    }
}

/**
 * Check if item ID is valid.
 */
export function isValidItemId(itemId: string): boolean {
    return itemId in ITEM_REGISTRY;
}

/**
 * Get all required items.
 */
export function getRequiredItems(): MeasurementItem[] {
    return Object.values(ITEM_REGISTRY).filter(item => item.required);
}

/**
 * Get all item IDs.
 */
export function getAllItemIds(): string[] {
    return Object.keys(ITEM_REGISTRY);
}

/**
 * Validate registry integrity at runtime.
 */
export function validateItemRegistry(): void {
    for (const [itemId, item] of Object.entries(ITEM_REGISTRY)) {
        // Check item ID matches key
        if (item.itemId !== itemId) {
            throw new Error(`[ItemRegistry] Item "${itemId}" has mismatched itemId "${item.itemId}"`);
        }

        // Check index is valid
        if (!isValidIndexId(item.associatedIndex)) {
            throw new Error(`[ItemRegistry] Item "${itemId}" has invalid index "${item.associatedIndex}"`);
        }

        // Check driver is valid
        if (!isValidDriverFamilyId(item.driverFamily)) {
            throw new Error(`[ItemRegistry] Item "${itemId}" has invalid driver "${item.driverFamily}"`);
        }

        // Check bounds match scale type
        const expected = SCALE_BOUNDS[item.scaleType];
        if (item.minValue !== expected.min || item.maxValue !== expected.max) {
            throw new Error(
                `[ItemRegistry] Item "${itemId}" bounds [${item.minValue}, ${item.maxValue}] ` +
                `don't match scale type ${item.scaleType} [${expected.min}, ${expected.max}]`
            );
        }
    }
}

// Run validation on module load
validateItemRegistry();

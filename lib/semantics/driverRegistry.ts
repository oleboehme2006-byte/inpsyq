/**
 * DRIVER REGISTRY — Internal Driver Family Definitions
 * 
 * Defines the canonical set of INTERNAL driver families that contribute to indices.
 * Each driver family has explicit allowed and disallowed index relationships.
 * 
 * RULES:
 * - A driver family MAY NOT contribute to an index unless explicitly allowed
 * - If a driver is assigned to a forbidden index, validation MUST throw
 * - Driver families represent psychological mechanisms, not observable behaviors
 */

import { IndexId } from './indexRegistry';

// ============================================================================
// Types
// ============================================================================

export type DriverFamilyId =
    | 'cognitive_load'
    | 'emotional_load'
    | 'role_conflict'
    | 'autonomy_friction'
    | 'social_safety'
    | 'alignment_clarity';

export interface DriverFamilyDefinition {
    readonly id: DriverFamilyId;
    readonly displayName: string;
    readonly psychologicalMechanism: string;
    readonly allowedIndices: readonly IndexId[];
    readonly disallowedIndices: readonly IndexId[];
    readonly notes: string;
}

// ============================================================================
// Registry
// ============================================================================

export const DRIVER_REGISTRY: Readonly<Record<DriverFamilyId, DriverFamilyDefinition>> = {
    cognitive_load: {
        id: 'cognitive_load',
        displayName: 'Cognitive Load',
        psychologicalMechanism:
            'Mental effort required to process information, make decisions, and maintain task focus. ' +
            'Depletes executive function resources and reduces capacity for complex reasoning.',
        allowedIndices: ['strain', 'withdrawal_risk'],
        disallowedIndices: ['engagement', 'trust_gap'],
        notes:
            'Cognitive load contributes to strain through resource depletion. ' +
            'High cognitive load can trigger withdrawal as a coping mechanism. ' +
            'Does not directly affect trust (relational) or engagement (motivational).',
    },

    emotional_load: {
        id: 'emotional_load',
        displayName: 'Emotional Load',
        psychologicalMechanism:
            'Accumulated burden of regulating emotions, suppressing authentic reactions, ' +
            'and managing interpersonal stress. Leads to emotional exhaustion.',
        allowedIndices: ['strain', 'withdrawal_risk', 'engagement'],
        disallowedIndices: ['trust_gap'],
        notes:
            'Emotional load directly causes strain accumulation. ' +
            'Chronic emotional exhaustion triggers withdrawal and reduces engagement. ' +
            'Trust gap is a relational construct, not affected by internal emotional regulation.',
    },

    role_conflict: {
        id: 'role_conflict',
        displayName: 'Role Conflict',
        psychologicalMechanism:
            'Experience of incompatible expectations from multiple sources or within a single role. ' +
            'Creates cognitive dissonance and prevents effective prioritization.',
        allowedIndices: ['strain', 'trust_gap', 'engagement'],
        disallowedIndices: ['withdrawal_risk'],
        notes:
            'Role conflict increases strain through unresolvable tension. ' +
            'Conflicting expectations widen trust gap (perceived broken promises). ' +
            'Reduces engagement through frustration and learned helplessness. ' +
            'Does not directly trigger withdrawal (more effort-based than exit-based).',
    },

    autonomy_friction: {
        id: 'autonomy_friction',
        displayName: 'Autonomy Friction',
        psychologicalMechanism:
            'Constraints on discretion, blocked decision-making authority, ' +
            'and excessive permission requirements. Undermines self-determination.',
        allowedIndices: ['strain', 'engagement', 'withdrawal_risk'],
        disallowedIndices: ['trust_gap'],
        notes:
            'Autonomy friction creates strain through blocked goals. ' +
            'Self-determination theory: low autonomy reduces intrinsic engagement. ' +
            'Chronic friction can trigger withdrawal as escape behavior. ' +
            'Trust gap is about expectations vs reality, not control dynamics.',
    },

    social_safety: {
        id: 'social_safety',
        displayName: 'Social Safety',
        psychologicalMechanism:
            'Belief that interpersonal risk-taking (speaking up, asking questions) will not result ' +
            'in punishment, embarrassment, or marginalization.',
        allowedIndices: ['trust_gap', 'engagement', 'withdrawal_risk'],
        disallowedIndices: ['strain'],
        notes:
            'Low social safety directly widens trust gap. ' +
            'Safety is a prerequisite for full engagement expression. ' +
            'Chronic unsafety triggers protective withdrawal. ' +
            'Strain is about load/capacity, not social dynamics.',
    },

    alignment_clarity: {
        id: 'alignment_clarity',
        displayName: 'Alignment Clarity',
        psychologicalMechanism:
            'Degree to which organizational purpose, strategy, and individual role contribution ' +
            'are understood and internalized. Enables meaningful work perception.',
        allowedIndices: ['engagement', 'trust_gap'],
        disallowedIndices: ['strain', 'withdrawal_risk'],
        notes:
            'Clear alignment enables engagement through meaning-making. ' +
            'Misalignment signals broken psychological contracts (trust gap). ' +
            'Does not directly affect strain (load-based) or withdrawal (exit-based).',
    },
} as const;

// ============================================================================
// Validation & Assertions
// ============================================================================

/**
 * Validates that a driver family is allowed to contribute to a given index.
 * Throws if the combination is forbidden.
 */
export function validateDriverIndexAssignment(
    driverId: DriverFamilyId,
    indexId: IndexId
): void {
    const driver = DRIVER_REGISTRY[driverId];
    if (!driver) {
        throw new Error(`Driver family "${driverId}" not found in registry`);
    }

    // Check if explicitly disallowed
    if (driver.disallowedIndices.includes(indexId)) {
        throw new Error(
            `FORBIDDEN: Driver "${driverId}" cannot contribute to index "${indexId}". ` +
            `Reason: ${driver.notes}`
        );
    }

    // Check if allowed (must be explicitly listed)
    if (!driver.allowedIndices.includes(indexId)) {
        throw new Error(
            `INVALID: Driver "${driverId}" is not in allowed list for index "${indexId}". ` +
            `Allowed indices: [${driver.allowedIndices.join(', ')}]`
        );
    }
}

/**
 * Get driver family definition by ID. Throws if not found.
 */
export function getDriverDefinition(id: DriverFamilyId): DriverFamilyDefinition {
    const def = DRIVER_REGISTRY[id];
    if (!def) {
        throw new Error(`Driver family "${id}" not found in registry`);
    }
    return def;
}

/**
 * Get all driver families that can contribute to a given index.
 */
export function getDriversForIndex(indexId: IndexId): DriverFamilyDefinition[] {
    return Object.values(DRIVER_REGISTRY).filter(
        driver => driver.allowedIndices.includes(indexId)
    );
}

/**
 * Validates the internal consistency of the driver registry.
 * Ensures no driver has the same index in both allowed and disallowed lists.
 */
export function validateDriverRegistry(): void {
    for (const [id, driver] of Object.entries(DRIVER_REGISTRY)) {
        const overlap = driver.allowedIndices.filter(idx =>
            driver.disallowedIndices.includes(idx)
        );
        if (overlap.length > 0) {
            throw new Error(
                `Driver "${id}" has indices in both allowed and disallowed: [${overlap.join(', ')}]`
            );
        }

        // Ensure all 4 indices are accounted for (either allowed or disallowed)
        const allIndices: IndexId[] = ['strain', 'withdrawal_risk', 'trust_gap', 'engagement'];
        const covered = [...driver.allowedIndices, ...driver.disallowedIndices];
        const missing = allIndices.filter(idx => !covered.includes(idx));
        if (missing.length > 0) {
            throw new Error(
                `Driver "${id}" does not specify relationship for indices: [${missing.join(', ')}]. ` +
                `All indices must be explicitly allowed or disallowed.`
            );
        }
    }
}

// ============================================================================
// Type Guards
// ============================================================================

export function isValidDriverFamilyId(id: string): id is DriverFamilyId {
    return id in DRIVER_REGISTRY;
}

// Run validation on module load (fail fast)
validateDriverRegistry();

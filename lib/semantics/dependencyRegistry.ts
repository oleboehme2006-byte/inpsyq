/**
 * DEPENDENCY REGISTRY — External Dependency Signal Definitions
 * 
 * Defines EXTERNAL dependency types that affect indices but are outside direct control.
 * Dependencies cannot generate internal actions — they can only increase severity
 * and reduce action eligibility.
 * 
 * RULES:
 * - Dependencies CANNOT generate internal actions
 * - Dependencies CAN increase severity
 * - Dependencies REDUCE action eligibility (low controllability = limited response options)
 */

import { IndexId } from './indexRegistry';

// ============================================================================
// Types
// ============================================================================

export type DependencyTypeId =
    | 'organizational'
    | 'process'
    | 'temporal_deadline';

export type Controllability = 'low' | 'medium' | 'high';

export interface DependencyTypeDefinition {
    readonly id: DependencyTypeId;
    readonly displayName: string;
    readonly description: string;
    readonly allowedAffectedIndices: readonly IndexId[];
    readonly controllability: Controllability;
    readonly examples: readonly string[];
    readonly notes: string;
}

// ============================================================================
// Registry
// ============================================================================

export const DEPENDENCY_REGISTRY: Readonly<Record<DependencyTypeId, DependencyTypeDefinition>> = {
    organizational: {
        id: 'organizational',
        displayName: 'Organizational Dependency',
        description:
            'Dependencies arising from organizational structure, hierarchy, or cross-functional interfaces. ' +
            'Includes reporting relationships, approval chains, and inter-team coordination requirements.',
        allowedAffectedIndices: ['strain', 'trust_gap', 'engagement'],
        controllability: 'low',
        examples: [
            'Waiting for executive approval on budget allocation',
            'Cross-functional team not delivering expected inputs',
            'Reorg causing reporting line confusion',
            'HR policy blocking hiring for understaffed team',
        ],
        notes:
            'Organizational dependencies have LOW controllability because they require ' +
            'structural changes beyond immediate team authority. Increases severity ' +
            'because team cannot directly resolve the blocker.',
    },

    process: {
        id: 'process',
        displayName: 'Process Dependency',
        description:
            'Dependencies arising from formal processes, workflows, or procedural requirements. ' +
            'Includes compliance gates, review cycles, and tooling constraints.',
        allowedAffectedIndices: ['strain', 'engagement', 'withdrawal_risk'],
        controllability: 'medium',
        examples: [
            'Security review required before deployment',
            'Legal approval cycle for customer-facing changes',
            'Build pipeline performance degradation',
            'Mandatory documentation review adding cycle time',
        ],
        notes:
            'Process dependencies have MEDIUM controllability because processes can often ' +
            'be optimized or exceptions granted, but not immediately. May trigger withdrawal ' +
            'if perceived as bureaucratic obstruction.',
    },

    temporal_deadline: {
        id: 'temporal_deadline',
        displayName: 'Temporal / Deadline Dependency',
        description:
            'Dependencies arising from fixed time constraints, external commitments, or calendar-based pressures. ' +
            'Includes customer commitments, regulatory deadlines, and market timing.',
        allowedAffectedIndices: ['strain', 'withdrawal_risk'],
        controllability: 'low',
        examples: [
            'Customer contractual delivery date',
            'Regulatory compliance deadline',
            'Trade show or launch event timing',
            'Fiscal quarter end pressure',
        ],
        notes:
            'Temporal dependencies have LOW controllability because deadlines are typically ' +
            'external commitments. High strain amplification effect because options narrow ' +
            'as deadline approaches. Does not affect trust_gap (not relational) or ' +
            'engagement (can coexist with high engagement).',
    },
} as const;

// ============================================================================
// Core Rules (Documented as Code)
// ============================================================================

/**
 * RULE: Dependencies CANNOT generate internal actions.
 * This function enforces that dependency signals are only used for severity
 * amplification and action eligibility reduction, never for action generation.
 */
export function assertDependencyCannotGenerateAction(
    _dependencyId: DependencyTypeId,
    _attemptedAction: string
): never {
    throw new Error(
        `FORBIDDEN: Dependencies cannot generate internal actions. ` +
        `Dependencies can only increase severity and reduce action eligibility. ` +
        `Attempted action generation from dependency is a semantic violation.`
    );
}

/**
 * RULE: Low controllability caps action eligibility.
 * Returns the maximum action eligibility score based on dependency controllability.
 */
export function getMaxActionEligibility(controllability: Controllability): number {
    switch (controllability) {
        case 'low':
            return 0.3; // Severely limited action options
        case 'medium':
            return 0.6; // Moderate constraints
        case 'high':
            return 1.0; // Full eligibility
        default:
            throw new Error(`Unknown controllability level: ${controllability}`);
    }
}

// ============================================================================
// Validation & Helpers
// ============================================================================

/**
 * Get dependency definition by ID. Throws if not found.
 */
export function getDependencyDefinition(id: DependencyTypeId): DependencyTypeDefinition {
    const def = DEPENDENCY_REGISTRY[id];
    if (!def) {
        throw new Error(`Dependency type "${id}" not found in registry`);
    }
    return def;
}

/**
 * Validate that an index is allowed to be affected by a dependency type.
 */
export function validateDependencyIndexEffect(
    dependencyId: DependencyTypeId,
    indexId: IndexId
): void {
    const dep = getDependencyDefinition(dependencyId);
    if (!dep.allowedAffectedIndices.includes(indexId)) {
        throw new Error(
            `INVALID: Dependency "${dependencyId}" cannot affect index "${indexId}". ` +
            `Allowed indices: [${dep.allowedAffectedIndices.join(', ')}]`
        );
    }
}

// ============================================================================
// Type Guards
// ============================================================================

export function isValidDependencyTypeId(id: string): id is DependencyTypeId {
    return id in DEPENDENCY_REGISTRY;
}

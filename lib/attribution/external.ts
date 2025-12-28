/**
 * EXTERNAL DEPENDENCY ATTRIBUTION — External Dependency Processing
 * 
 * Processes external dependency candidates:
 * - Computes impact via computeDependencyImpact()
 * - Pulls controllability from dependencyRegistry
 * - Generates deterministic templated explanations
 * - Prunes and sorts results
 */

import { DependencyTypeId, getDependencyDefinition, DEPENDENCY_REGISTRY } from '../semantics/dependencyRegistry';
import { computeDependencyImpact } from '../scoring/dependencyImpact';
import { getImpactColor } from '../scoring/severityColors';
import { DependencyImpactLevel } from '../scoring/types';

import { ExternalDependencyCandidate } from './input';
import {
    ExternalDependencyAttribution,
    toControllabilityDisplay,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const MAX_EXTERNAL_DEPENDENCIES = 3;

const IMPACT_ORDER: Record<DependencyImpactLevel, number> = {
    D1: 1,
    D2: 2,
    D3: 3,
};

// ============================================================================
// Deterministic Templates
// ============================================================================

/**
 * Templates vary by dependency type for deterministic but distinct explanations.
 */
const PATHWAY_TEMPLATES: Record<DependencyTypeId, string> = {
    organizational:
        'Decisions are blocked at the organizational interface. Approval chains and cross-functional coordination create systemic delays that compound index pressure.',
    process:
        'Process requirements introduce mandatory wait states. Compliance gates and review cycles constrain the team\'s ability to respond to changing conditions.',
    temporal_deadline:
        'Fixed external commitments create time pressure that cannot be extended. As the deadline approaches, options narrow and pressure intensifies.',
};

const FAILURE_MODE_TEMPLATES: Record<DependencyTypeId, string> = {
    organizational:
        'Coordination failures manifest as delayed decisions, unclear ownership, and misaligned priorities across organizational boundaries.',
    process:
        'Process bottlenecks cause queuing delays, rework cycles, and blocked progression through mandatory gates.',
    temporal_deadline:
        'Deadline compression leads to scope cuts, quality compromises, or missed commitments when buffer is exhausted.',
};

const EARLY_SIGNALS_TEMPLATES: Record<DependencyTypeId, readonly string[]> = {
    organizational: [
        'Escalation patterns increasing in frequency',
        'Response latency from dependent teams growing',
        'Decision reversals or conflicting guidance',
    ],
    process: [
        'Queue depth increasing for required reviews',
        'Exception requests becoming routine',
        'Rework cycles extending beyond estimates',
    ],
    temporal_deadline: [
        'Buffer consumption accelerating',
        'Scope discussions intensifying',
        'Contingency options being evaluated',
    ],
};

const COORDINATION_LEVERS_TEMPLATES: Record<DependencyTypeId, readonly string[]> = {
    organizational: [
        'Establish regular sync cadence with dependent stakeholders',
        'Clarify escalation paths and decision rights',
        'Document cross-team dependencies and owners',
    ],
    process: [
        'Negotiate priority lanes for critical items',
        'Front-load compliance requirements',
        'Establish clear handoff criteria',
    ],
    temporal_deadline: [
        'Identify scope flexibility and trade-offs',
        'Establish early warning checkpoints',
        'Prepare contingency scenarios',
    ],
};

const WHAT_WE_CONTROL_TEMPLATES: Record<DependencyTypeId, readonly string[]> = {
    organizational: [
        'Quality and completeness of our requests',
        'Proactive communication of status and blockers',
        'Early identification of dependency risks',
    ],
    process: [
        'Submission quality and timing',
        'Internal readiness before handoff',
        'Clear documentation of requirements',
    ],
    temporal_deadline: [
        'Internal pacing and milestone tracking',
        'Early scope decisions',
        'Resource allocation and focus',
    ],
};

// ============================================================================
// Main Processing
// ============================================================================

/**
 * Process external dependency candidates.
 */
export function processExternalDependencies(
    candidates: readonly ExternalDependencyCandidate[]
): ExternalDependencyAttribution[] {
    const attributions: ExternalDependencyAttribution[] = [];

    for (const candidate of candidates) {
        const depDef = getDependencyDefinition(candidate.dependency);

        // Compute impact
        const impactResult = computeDependencyImpact({
            impactScore: candidate.impactScore,
            controllability: depDef.controllability,
            persistence: candidate.persistenceWeeks,
        });

        // Get color token
        const colorToken = getImpactColor(impactResult.impactLevel);

        // Get deterministic templates for this dependency type
        const attribution: ExternalDependencyAttribution = {
            dependency: candidate.dependency,
            impact: impactResult.impactLevel,
            controllability: toControllabilityDisplay(depDef.controllability),
            confidence: candidate.confidence,
            colorToken,
            pathway: PATHWAY_TEMPLATES[candidate.dependency],
            failureMode: FAILURE_MODE_TEMPLATES[candidate.dependency],
            earlySignals: EARLY_SIGNALS_TEMPLATES[candidate.dependency],
            coordinationLevers: COORDINATION_LEVERS_TEMPLATES[candidate.dependency],
            whatWeControl: WHAT_WE_CONTROL_TEMPLATES[candidate.dependency],
        };

        attributions.push(attribution);
    }

    // Sort and prune
    return pruneAndSortDependencies(attributions);
}

// ============================================================================
// Pruning & Sorting
// ============================================================================

function pruneAndSortDependencies(
    attributions: ExternalDependencyAttribution[]
): ExternalDependencyAttribution[] {
    // Sort by: 1) impact desc, 2) confidence desc
    const sorted = [...attributions].sort((a, b) => {
        const impactDiff = IMPACT_ORDER[b.impact] - IMPACT_ORDER[a.impact];
        if (impactDiff !== 0) return impactDiff;
        return b.confidence - a.confidence;
    });

    return sorted.slice(0, MAX_EXTERNAL_DEPENDENCIES);
}

/**
 * Calculate total impact mass from dependencies.
 */
export function calculateExternalMass(
    candidates: readonly ExternalDependencyCandidate[]
): number {
    return candidates.reduce((sum, c) => sum + c.impactScore, 0);
}

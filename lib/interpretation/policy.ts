/**
 * INTERPRETATION POLICY — Action Gating Rules
 * 
 * Deterministic rules for when actions appear in interpretations.
 * These rules MUST be unit tested.
 */

import {
    WeeklyInterpretationInput,
    InternalDriverInput,
    ExternalDependencyInput
} from './input';
import {
    SeverityLevel,
    ImpactLevel,
    Priority,
    WeeklyInterpretationSections
} from './types';

// ============================================================================
// Priority Mapping
// ============================================================================

export function severityToPriority(severity: SeverityLevel): Priority {
    switch (severity) {
        case 'C3': return 'IMMEDIATE';
        case 'C2': return 'HIGH';
        case 'C1': return 'NORMAL';
        case 'C0': return 'NONE';
    }
}

export function impactToPriority(impact: ImpactLevel): Priority {
    switch (impact) {
        case 'D3': return 'IMMEDIATE';
        case 'D2': return 'HIGH';
        case 'D1': return 'NORMAL';
        case 'D0': return 'NONE';
    }
}

// ============================================================================
// Policy Checks
// ============================================================================

export interface PolicyResult {
    allowInternalActions: boolean;
    allowExternalActions: boolean;
    maxRecommendedFocus: number;
    monitorOnly: boolean;
    highestPriority: Priority;
    reason: string;
}

/**
 * Evaluate policy for interpretation generation.
 */
export function evaluatePolicy(input: WeeklyInterpretationInput): PolicyResult {
    const { attribution, indices } = input;

    // Check internal driver severities
    const allInternalLow = attribution.internalDrivers.every(
        d => d.severityLevel === 'C0' || d.severityLevel === 'C1'
    );
    const hasHighInternal = attribution.internalDrivers.some(
        d => d.severityLevel === 'C2' || d.severityLevel === 'C3'
    );

    // Check external dependency impacts
    const allExternalLow = attribution.externalDependencies.every(
        d => d.impactLevel === 'D0' || d.impactLevel === 'D1'
    );
    const hasHighExternal = attribution.externalDependencies.some(
        d => d.impactLevel === 'D2' || d.impactLevel === 'D3'
    );

    // Check if indices are stable/improving
    const allStableOrImproving = indices.every(idx => {
        const isGoodDirection =
            (idx.indexId === 'engagement' && idx.trendDirection !== 'DOWN') ||
            (idx.indexId !== 'engagement' && idx.trendDirection !== 'UP');
        return isGoodDirection || idx.trendDirection === 'STABLE';
    });

    // Determine highest priority
    let highestPriority: Priority = 'NONE';
    for (const d of attribution.internalDrivers) {
        const p = severityToPriority(d.severityLevel);
        if (priorityRank(p) > priorityRank(highestPriority)) {
            highestPriority = p;
        }
    }
    for (const d of attribution.externalDependencies) {
        const p = impactToPriority(d.impactLevel);
        if (priorityRank(p) > priorityRank(highestPriority)) {
            highestPriority = p;
        }
    }

    // Policy Rule 1: EXTERNAL dominance => no internal actions
    const isExternalDominant =
        attribution.primarySource === 'EXTERNAL' &&
        (attribution.internalDrivers.length === 0 || allInternalLow);

    // Policy Rule 2: All stable/improving + low severity => monitor only
    const isMonitorOnly =
        allStableOrImproving &&
        allInternalLow &&
        allExternalLow;

    // Policy Rule 3: No C2+ and no D2+ => no urgent actions
    const noUrgentActions = !hasHighInternal && !hasHighExternal;

    // Determine max recommended focus items
    let maxRecommendedFocus = 5;
    if (isMonitorOnly) {
        maxRecommendedFocus = 1;
    } else if (noUrgentActions) {
        maxRecommendedFocus = 3;
    }

    // Build reason
    let reason = '';
    if (isExternalDominant) {
        reason = 'External dominance: internal actions suppressed';
    } else if (isMonitorOnly) {
        reason = 'Stable state: monitor only';
    } else if (noUrgentActions) {
        reason = 'No urgent issues: limited focus items';
    } else {
        reason = 'Active intervention warranted';
    }

    return {
        allowInternalActions: !isExternalDominant,
        allowExternalActions: true,
        maxRecommendedFocus,
        monitorOnly: isMonitorOnly,
        highestPriority,
        reason,
    };
}

function priorityRank(p: Priority): number {
    switch (p) {
        case 'IMMEDIATE': return 4;
        case 'HIGH': return 3;
        case 'NORMAL': return 2;
        case 'NONE': return 1;
    }
}

// ============================================================================
// Policy Enforcement
// ============================================================================

/**
 * Apply policy constraints to generated sections.
 * Mutates sections in place if violations found.
 */
export function enforcePolicy(
    sections: WeeklyInterpretationSections,
    input: WeeklyInterpretationInput,
    policy: PolicyResult
): { modified: boolean; changes: string[] } {
    const changes: string[] = [];
    let modified = false;

    // Enforce max recommended focus
    if (sections.recommendedFocus.length > policy.maxRecommendedFocus) {
        sections.recommendedFocus = sections.recommendedFocus.slice(0, policy.maxRecommendedFocus);
        changes.push(`Trimmed recommendedFocus to ${policy.maxRecommendedFocus}`);
        modified = true;
    }

    // Enforce monitor-only
    if (policy.monitorOnly && sections.recommendedFocus.length > 1) {
        sections.recommendedFocus = ['Continue monitoring current trajectory'];
        changes.push('Replaced focus with monitor-only');
        modified = true;
    }

    // Enforce no internal actions when external dominant
    if (!policy.allowInternalActions) {
        const filteredFocus = sections.recommendedFocus.filter(f =>
            f.toLowerCase().includes('coordinate') ||
            f.toLowerCase().includes('monitor') ||
            f.toLowerCase().includes('external')
        );
        if (filteredFocus.length !== sections.recommendedFocus.length) {
            sections.recommendedFocus = filteredFocus.length > 0
                ? filteredFocus
                : ['Coordinate with external stakeholders on capacity and timing'];
            changes.push('Removed internal action items (external dominant)');
            modified = true;
        }
    }

    return { modified, changes };
}

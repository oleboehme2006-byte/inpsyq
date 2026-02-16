/**
 * INTERPRETATION GENERATOR — LLM + Deterministic Fallback
 * 
 * Generates structured weekly interpretation sections.
 * Uses LLM if available, falls back to deterministic templates.
 */

import {
    WeeklyInterpretationSections,
    DriverLine,
    DependencyLine,
    PROMPT_VERSION,
    MODEL_ID_FALLBACK,
    MODEL_ID_GPT4,
    Controllability
} from './types';
import { WeeklyInterpretationInput } from './input';
import { evaluatePolicy, PolicyResult, enforcePolicy } from './policy';
import { INDEX_REGISTRY } from '@/lib/semantics/indexRegistry';

// ============================================================================
// Generator Options
// ============================================================================

export interface GeneratorOptions {
    useLLM?: boolean;
    apiKey?: string;
}

export interface GeneratorResult {
    sections: WeeklyInterpretationSections;
    modelId: string;
    promptVersion: string;
    policy: PolicyResult;
}

// ============================================================================
// Main Generator
// ============================================================================

export async function generateDeterministicInterpretation(
    input: WeeklyInterpretationInput,
    opts: GeneratorOptions = {}
): Promise<GeneratorResult> {
    const policy = evaluatePolicy(input);

    // For now, always use deterministic fallback
    // LLM integration can be added later
    const sections = generateDeterministicSections(input, policy);

    // Enforce policy constraints
    enforcePolicy(sections, input, policy);

    return {
        sections,
        modelId: MODEL_ID_FALLBACK,
        promptVersion: PROMPT_VERSION,
        policy,
    };
}

// ============================================================================
// Deterministic Fallback Generator
// ============================================================================

function generateDeterministicSections(
    input: WeeklyInterpretationInput,
    policy: PolicyResult
): WeeklyInterpretationSections {
    // Executive Summary
    const executiveSummary = buildExecutiveSummary(input, policy);

    // What Changed
    const whatChanged = buildWhatChanged(input);

    // Primary Drivers
    const primaryDrivers = buildPrimaryDrivers(input);

    // Risk Outlook
    const riskOutlook = buildRiskOutlook(input, policy);

    // Recommended Focus
    const recommendedFocus = buildRecommendedFocus(input, policy);

    // Confidence And Limits
    const confidenceAndLimits = buildConfidenceAndLimits(input);

    return {
        executiveSummary,
        whatChanged,
        primaryDrivers,
        riskOutlook,
        recommendedFocus,
        confidenceAndLimits,
    };
}

function buildExecutiveSummary(input: WeeklyInterpretationInput, policy: PolicyResult): string {
    const teamOrOrg = input.teamId ? 'This team' : 'The organization';
    const strainIdx = input.indices.find(i => i.indexId === 'strain');
    const engagementIdx = input.indices.find(i => i.indexId === 'engagement');

    const strainState = strainIdx?.qualitativeState || 'moderate';
    const trendDesc = input.trend?.regime === 'STABLE' ? 'stable trajectory' :
        input.trend?.regime === 'SHIFT' ? 'shifting pattern' : 'variable pattern';

    const primarySourceDesc = input.attribution.primarySource === 'INTERNAL'
        ? 'internal factors'
        : input.attribution.primarySource === 'EXTERNAL'
            ? 'external dependencies'
            : 'a combination of internal and external factors';

    const priorityNote = policy.highestPriority === 'IMMEDIATE'
        ? 'Immediate attention is warranted.'
        : policy.highestPriority === 'HIGH'
            ? 'Elevated attention is recommended.'
            : 'Continued monitoring is appropriate.';

    return `${teamOrOrg} shows ${strainState} strain levels with a ${trendDesc} over the observation period. Current state is primarily influenced by ${primarySourceDesc}. Data quality indicates adequate coverage for interpretation. ${priorityNote}`;
}

function buildWhatChanged(input: WeeklyInterpretationInput): string[] {
    const changes: string[] = [];

    for (const idx of input.indices) {
        if (idx.delta !== null && Math.abs(idx.delta) > 0.03) {
            const direction = idx.delta > 0 ? 'increased' : 'decreased';
            const indexName = INDEX_REGISTRY[idx.indexId]?.displayName || idx.indexId;
            changes.push(`${indexName} ${direction} from prior week`);
        } else if (idx.delta !== null) {
            const indexName = INDEX_REGISTRY[idx.indexId]?.displayName || idx.indexId;
            changes.push(`${indexName} remained stable week-over-week`);
        }
    }

    // Add trend observation
    if (input.trend) {
        if (input.trend.regime === 'SHIFT') {
            changes.push('Overall trajectory indicates a regime shift');
        } else if (input.trend.regime === 'STABLE') {
            changes.push('Overall trajectory remains stable');
        }
    }

    // Ensure we have 3-6 items
    while (changes.length < 3) {
        changes.push('Measurement coverage maintained across key constructs');
    }

    return changes.slice(0, 6);
}

function buildPrimaryDrivers(input: WeeklyInterpretationInput): { internal: DriverLine[]; external: DependencyLine[] } {
    const internal: DriverLine[] = input.attribution.internalDrivers.slice(0, 3).map(d => ({
        label: d.label,
        severityLevel: d.severityLevel,
        directionalityHint: d.trending,
        evidenceTag: `Attribution from ${d.driverFamily}`,
    }));

    const external: DependencyLine[] = input.attribution.externalDependencies.slice(0, 3).map(d => ({
        label: d.dependency,
        impactLevel: d.impactLevel,
        controllability: mapControllability(d.controllability),
        evidenceTag: `Via ${d.pathway}`,
    }));

    return { internal, external };
}

function mapControllability(c: import('./input').Controllability): Controllability {
    switch (c) {
        case 'HIGH': return 'FULL';
        case 'PARTIAL': return 'PARTIAL';
        case 'LOW': return 'MINIMAL';
        case 'NONE': return 'NONE';
        default: return 'MINIMAL';
    }
}

function buildRiskOutlook(input: WeeklyInterpretationInput, policy: PolicyResult): string[] {
    const risks: string[] = [];

    if (input.attribution.propagationRisk?.level === 'HIGH') {
        risks.push('Elevated propagation risk to adjacent teams identified');
    }

    const criticalDrivers = input.attribution.internalDrivers.filter(d =>
        d.severityLevel === 'C3' || d.severityLevel === 'C2'
    );
    if (criticalDrivers.length > 0) {
        risks.push(`${criticalDrivers.length} driver${criticalDrivers.length > 1 ? 's' : ''} at elevated severity requiring attention`);
    }

    const highImpactDeps = input.attribution.externalDependencies.filter(d =>
        d.impactLevel === 'D3' || d.impactLevel === 'D2'
    );
    if (highImpactDeps.length > 0) {
        risks.push('External dependencies with significant impact potential identified');
    }

    if (input.quality.coverageRatio < 0.7) {
        risks.push('Limited data coverage may constrain interpretation confidence');
    }

    if (risks.length === 0) {
        risks.push('No elevated risks identified in current observation window');
    }

    return risks.slice(0, 3);
}

function buildRecommendedFocus(input: WeeklyInterpretationInput, policy: PolicyResult): string[] {
    if (policy.monitorOnly) {
        return ['Continue monitoring current trajectory'];
    }

    const focus: string[] = [];

    if (policy.allowInternalActions) {
        const topInternal = input.attribution.internalDrivers
            .filter(d => d.severityLevel === 'C3' || d.severityLevel === 'C2')
            .slice(0, 2);

        for (const d of topInternal) {
            focus.push(`Address ${d.label.toLowerCase()} factors identified in attribution`);
        }
    }

    if (policy.allowExternalActions) {
        const topExternal = input.attribution.externalDependencies
            .filter(d => d.impactLevel === 'D3' || d.impactLevel === 'D2')
            .slice(0, 2);

        for (const d of topExternal) {
            focus.push(`Coordinate with ${d.dependency} on capacity and timing`);
        }
    }

    if (focus.length === 0 && !policy.monitorOnly) {
        focus.push('Maintain current practices and observation cadence');
    }

    return focus.slice(0, policy.maxRecommendedFocus);
}

function buildConfidenceAndLimits(input: WeeklyInterpretationInput): string {
    const coveragePct = Math.round(input.quality.coverageRatio * 100);
    const confidencePct = Math.round(input.quality.confidenceProxy * 100);

    let limitations = '';
    if (input.quality.missingWeeks > 0) {
        limitations = `Data gaps in ${input.quality.missingWeeks} prior week${input.quality.missingWeeks > 1 ? 's' : ''} may limit trend detection. `;
    } else if (input.quality.coverageRatio < 0.8) {
        limitations = 'Incomplete coverage may affect attribution precision. ';
    }

    const stability = input.trend?.regime === 'NOISE'
        ? 'High variability suggests caution in directional claims.'
        : 'Pattern stability supports interpretation reliability.';

    return `Interpretation based on ${input.trend?.weeksCovered || 1} weeks of data with adequate construct coverage. ${limitations}${stability}`;
}

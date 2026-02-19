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
    DriverDetailCard,
    ActionDetailCard,
    PROMPT_VERSION,
    MODEL_ID_FALLBACK,
} from './types';
import { WeeklyInterpretationInput } from './input';
import { evaluatePolicy, PolicyResult, enforcePolicy } from './policy';
import { INDEX_REGISTRY } from '@/lib/semantics/indexRegistry';
import { DRIVER_CONTENT } from '@/lib/content/driverLibrary';
import { isValidDriverFamilyId } from '@/lib/semantics/driverRegistry';

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

    // Phase 9: Rich Dashboard Content
    const driverCards = buildDriverCards(input, policy);
    const actionCards = buildActionCards(input, policy);
    const briefingParagraphs = buildBriefingParagraphs(input, policy);

    return {
        executiveSummary,
        whatChanged,
        primaryDrivers,
        riskOutlook,
        recommendedFocus,
        confidenceAndLimits,
        driverCards,
        actionCards,
        briefingParagraphs,
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
        controllability: d.controllability,
        evidenceTag: `Via ${d.pathway}`,
    }));

    return { internal, external };
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

// ============================================================================
// Phase 9: Rich Dashboard Content Builders (Deterministic Fallback)
// ============================================================================

/**
 * Build driver detail cards from input attribution and DRIVER_CONTENT library.
 * Produces cards matching the TeamDriver.details and executive driver details contracts.
 */
function buildDriverCards(
    input: WeeklyInterpretationInput,
    _policy: PolicyResult
): DriverDetailCard[] {
    const cards: DriverDetailCard[] = [];

    for (const driver of input.attribution.internalDrivers.slice(0, 3)) {
        const familyId = driver.driverFamily;
        if (!isValidDriverFamilyId(familyId)) continue;

        const content = DRIVER_CONTENT[familyId];
        if (!content) continue;

        cards.push({
            driverFamily: familyId,
            label: content.label,
            mechanism: content.mechanism,
            causality: content.causality,
            effects: content.effects,
            recommendation: content.recommendation,
        });
    }

    return cards;
}

/**
 * Build action detail cards from drivers and risk signals.
 * Maps high-severity drivers to actionable interventions.
 */
function buildActionCards(
    input: WeeklyInterpretationInput,
    policy: PolicyResult
): ActionDetailCard[] {
    if (policy.monitorOnly) return [];

    const actions: ActionDetailCard[] = [];
    const strainIdx = input.indices.find(i => i.indexId === 'strain');
    const engagementIdx = input.indices.find(i => i.indexId === 'engagement');

    // Generate actions for high-severity internal drivers
    const criticalDrivers = input.attribution.internalDrivers
        .filter(d => d.severityLevel === 'C3' || d.severityLevel === 'C2')
        .slice(0, 2);

    for (const driver of criticalDrivers) {
        const familyId = driver.driverFamily;
        const content = isValidDriverFamilyId(familyId) ? DRIVER_CONTENT[familyId] : null;
        const label = content?.label || driver.label;

        const severity: ActionDetailCard['severity'] = driver.severityLevel === 'C3' ? 'critical' : 'warning';
        const criticality: ActionDetailCard['criticality'] = driver.severityLevel === 'C3' ? 'HIGH' : 'AT RISK';

        actions.push({
            title: `Address ${label}`,
            severity,
            message: `${label} requires ${severity === 'critical' ? 'immediate' : 'timely'} intervention based on current severity.`,
            context: content?.mechanism || `${label} has been identified as a significant contributor to the current team state through the attribution analysis.`,
            rationale: content?.causality || `Addressing this driver is expected to reduce strain and improve team dynamics based on established psychometric models.`,
            effects: content?.effects || `Without intervention, this driver is likely to amplify strain and withdrawal signals in the coming observation windows.`,
            criticality,
            recommendation: content?.recommendation || `Review team workload and process structures to identify specific intervention points for ${label.toLowerCase()}.`,
        });
    }

    // Generate a data-quality action if coverage is low
    if (input.quality.coverageRatio < 0.7 && actions.length < 3) {
        actions.push({
            title: 'Improve Data Coverage',
            severity: 'info',
            message: 'Limited data coverage is reducing interpretation confidence.',
            context: `Current measurement coverage is at a reduced level, which constrains the ability to identify nuanced patterns and emerging trends.`,
            rationale: `Robust psychometric assessment requires adequate representation across all team members and constructs to ensure valid conclusions.`,
            effects: `Higher coverage enables earlier detection of shifts and more precise attribution, allowing for proactive rather than reactive interventions.`,
            criticality: 'LOW',
            recommendation: `Encourage broader participation in the measurement process to strengthen the foundation for team insights and recommendations.`,
        });
    }

    return actions.slice(0, 3);
}

/**
 * Build briefing paragraphs for the dashboard briefing section.
 * Produces 2 paragraphs with inline HTML spans for emphasis.
 */
function buildBriefingParagraphs(
    input: WeeklyInterpretationInput,
    policy: PolicyResult
): string[] {
    const teamOrOrg = input.teamId ? 'This team' : 'The organization';
    const strainIdx = input.indices.find(i => i.indexId === 'strain');
    const engagementIdx = input.indices.find(i => i.indexId === 'engagement');
    const withdrawalIdx = input.indices.find(i => i.indexId === 'withdrawal_risk');

    const strainValue = strainIdx ? Math.round(strainIdx.currentValue * 100) : null;
    const engagementValue = engagementIdx ? Math.round(engagementIdx.currentValue * 100) : null;
    const strainTrend = strainIdx?.trendDirection === 'UP' ? 'an upward trajectory'
        : strainIdx?.trendDirection === 'DOWN' ? 'a downward trajectory'
            : 'a stable trajectory';

    // Primary drivers text
    const topDrivers = input.attribution.internalDrivers.slice(0, 2);
    const driverNames = topDrivers.map(d => {
        const content = isValidDriverFamilyId(d.driverFamily) ? DRIVER_CONTENT[d.driverFamily] : null;
        return content?.label || d.label;
    });
    const driverText = driverNames.length > 0
        ? `primarily driven by <span class="text-white">${driverNames.join('</span> and <span class="text-white">')}</span>`
        : 'without a single dominant driver identified';

    // Paragraph 1: Situation Assessment
    const strainDisplay = strainValue !== null
        ? `<span class="text-strain">${strainValue}%</span>`
        : 'elevated levels';
    const engagementDisplay = engagementValue !== null
        ? `<span class="text-engagement">${engagementValue}%</span>`
        : 'current levels';

    const para1 = `${teamOrOrg} is currently operating at a strain level of ${strainDisplay} with ${strainTrend}, ${driverText}. Engagement stands at ${engagementDisplay}, and the overall trend regime indicates a ${input.trend?.regime?.toLowerCase() || 'stable'} pattern. ${policy.highestPriority === 'IMMEDIATE' || policy.highestPriority === 'HIGH' ? 'The current trajectory warrants proactive intervention to prevent further deterioration.' : 'Continued monitoring is recommended to track the evolution of these dynamics.'}`;

    // Paragraph 2: Recommendation
    const topRecommendation = topDrivers.length > 0 && isValidDriverFamilyId(topDrivers[0].driverFamily)
        ? DRIVER_CONTENT[topDrivers[0].driverFamily]?.recommendation
        : null;

    const para2 = `<span class="text-white font-medium">Recommendation:</span> ${topRecommendation || 'Continue the current observation cadence and review attribution signals for emerging patterns.'} Data coverage currently supports ${input.quality.coverageRatio >= 0.8 ? 'confident' : 'moderate-confidence'} interpretation. ${input.quality.missingWeeks > 0 ? `Gaps in ${input.quality.missingWeeks} prior observation period${input.quality.missingWeeks > 1 ? 's' : ''} may limit trend analysis precision.` : 'Historical data continuity supports reliable trend detection.'}`;

    return [para1, para2];
}

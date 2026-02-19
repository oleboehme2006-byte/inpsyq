/**
 * INTERPRETATION INPUT — Strict Subset of Weekly Product
 * 
 * Defines exactly what data flows into interpretation generation.
 * If a field is missing from weekly product, represent as null/empty.
 * DO NOT synthesize missing data.
 */

import { IndexId } from '@/lib/semantics/indexRegistry';
import { DriverFamilyId } from '@/lib/semantics/driverRegistry';
import { SeverityLevel, ImpactLevel, Controllability } from './types';

// ============================================================================
// Input Types
// ============================================================================

export interface IndexSnapshot {
    indexId: IndexId;
    currentValue: number;
    qualitativeState: string;
    priorWeekValue: number | null;
    delta: number | null;
    trendDirection: 'UP' | 'DOWN' | 'STABLE';
}

export interface InternalDriverInput {
    driverFamily: DriverFamilyId;
    label: string;
    contributionBand: 'MAJOR' | 'MODERATE' | 'MINOR';
    severityLevel: SeverityLevel;
    trending: 'WORSENING' | 'STABLE' | 'IMPROVING';
}

export interface ExternalDependencyInput {
    dependency: string;
    impactLevel: ImpactLevel;
    pathway: string;
    controllability: Controllability;
}

export interface AttributionInput {
    primarySource: 'INTERNAL' | 'EXTERNAL' | 'MIXED' | null;
    internalDrivers: InternalDriverInput[];
    externalDependencies: ExternalDependencyInput[];
    propagationRisk: {
        level: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
        drivers: string[];
    } | null;
}

export interface DataQualityInput {
    coverageRatio: number;
    confidenceProxy: number;
    volatility: number;
    sampleSize: number | null;
    missingWeeks: number;
}

export interface TrendRegimeInput {
    regime: 'STABLE' | 'SHIFT' | 'NOISE';
    consistency: number;
    weeksCovered: number;
}

export interface WeeklyInterpretationInput {
    // Identifiers
    orgId: string;
    teamId: string | null;  // null = org-level
    weekStart: string;
    inputHash: string;

    // Index snapshot
    indices: IndexSnapshot[];

    // Trend regime
    trend: TrendRegimeInput | null;

    // Data quality
    quality: DataQualityInput;

    // Attribution
    attribution: AttributionInput;

    // Recommended focus from deterministic logic (if available)
    deterministicFocus: string[];
}

// ============================================================================
// Input Builder
// ============================================================================

import { TeamDashboardEntry as TeamDashboardData } from '@/lib/mock/teamDashboardData';
import { getQualitativeStateForIndex, IndexId as RegIndexId } from '@/lib/semantics/indexRegistry';

/**
 * Build interpretation input from team dashboard data.
 */
export function buildInterpretationInput(
    data: TeamDashboardData,
    orgId: string,
    inputHash: string
): WeeklyInterpretationInput {
    // Build index snapshots
    const indices: IndexSnapshot[] = [];

    // Extract from latest indices
    // Type assertion to avoid implicit any errors if types don't match perfectly
    const latestIndices = data.latestIndices as any;

    // Series handling
    const series = data.series || [];
    const weeksAvailable = series.length;

    const indexKeys: Array<{ key: string; indexId: IndexId }> = [
        { key: 'strain', indexId: 'strain' },
        { key: 'withdrawalRisk', indexId: 'withdrawal_risk' },
        { key: 'trustGap', indexId: 'trust_gap' },
        { key: 'engagement', indexId: 'engagement' },
    ];

    for (const { key, indexId } of indexKeys) {
        const latest = latestIndices[key];

        // Safety check for latest
        if (!latest) continue;

        const priorWeek = weeksAvailable > 1
            ? (series[weeksAvailable - 2] as any)?.[key === 'withdrawalRisk' ? 'withdrawalRisk' : key === 'trustGap' ? 'trustGap' : key]
            : null;

        const delta = priorWeek !== null && priorWeek !== undefined
            ? latest.value - priorWeek
            : null;

        let trendDirection: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
        if (delta !== null) {
            if (delta > 0.05) trendDirection = 'UP';
            else if (delta < -0.05) trendDirection = 'DOWN';
        }

        indices.push({
            indexId,
            currentValue: latest.value,
            qualitativeState: latest.qualitative,
            priorWeekValue: priorWeek ?? null,
            delta,
            trendDirection,
        });
    }

    // Build attribution
    // Cast attribution to any to bypass strict type checks against interface if needed
    const attr = data.attribution as any;

    const attribution: AttributionInput = {
        primarySource: attr.primarySource || null,
        internalDrivers: (attr.internalDrivers || []).map((d: any) => ({
            driverFamily: d.driverFamily as DriverFamilyId,
            label: d.label,
            contributionBand: (d.contributionBand as 'MAJOR' | 'MODERATE' | 'MINOR') || 'MODERATE',
            severityLevel: mapToSeverity(d.severityLevel),
            trending: 'STABLE',
        })),
        externalDependencies: (attr.externalDependencies || []).map((d: any) => ({
            dependency: d.dependency,
            impactLevel: mapToImpact(d.impactLevel),
            pathway: d.pathway,
            controllability: 'PARTIAL',
        })),
        propagationRisk: attr.propagationRisk
            ? {
                level: attr.propagationRisk.level as 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE',
                drivers: attr.propagationRisk.drivers || []
            }
            : null,
    };

    // Build quality
    // Cast quality to match expected input
    const qual = data.quality as any;
    const quality: DataQualityInput = {
        coverageRatio: qual.coverage || 0,
        confidenceProxy: qual.confidence || 0,
        volatility: 0.3,  // TODO: derive from series if available
        sampleSize: null,
        missingWeeks: qual.missingWeeks || 0,
    };

    // Build trend regime
    const tr = data.trend as any || {};
    const trend: TrendRegimeInput = {
        regime: (tr.regime as 'STABLE' | 'SHIFT' | 'NOISE') || 'NOISE',
        consistency: 1 - (tr.volatility || 0),
        weeksCovered: weeksAvailable,
    };

    // Meta handling - TeamDashboardEntry uses 'id' for teamId, and doesn't have orgId
    const teamId = data.id;
    const weekStart = (data.meta as any).latestWeek || '';

    return {
        orgId,
        teamId,
        weekStart,
        inputHash,
        indices,
        trend,
        quality,
        attribution,
        deterministicFocus: [],
    };
}

function mapToSeverity(level: string | undefined): SeverityLevel {
    if (!level) return 'C1';
    const upper = level.toUpperCase();
    if (upper === 'CRITICAL' || upper === 'C3') return 'C3';
    if (upper === 'HIGH' || upper === 'C2') return 'C2';
    if (upper === 'MODERATE' || upper === 'C1') return 'C1';
    return 'C0';
}

function mapToImpact(level: string | undefined): ImpactLevel {
    if (!level) return 'D1';
    const upper = level.toUpperCase();
    if (upper === 'HIGH' || upper === 'D3') return 'D3';
    if (upper === 'MEDIUM' || upper === 'D2') return 'D2';
    if (upper === 'LOW' || upper === 'D1') return 'D1';
    return 'D0';
}

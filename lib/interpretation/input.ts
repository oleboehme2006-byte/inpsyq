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

import { TeamDashboardData } from '@/services/dashboard/teamReader';
import { getQualitativeStateForIndex, IndexId as RegIndexId } from '@/lib/semantics/indexRegistry';

/**
 * Build interpretation input from team dashboard data.
 */
export function buildInterpretationInput(
    data: TeamDashboardData,
    inputHash: string
): WeeklyInterpretationInput {
    // Build index snapshots
    const indices: IndexSnapshot[] = [];

    // Extract from latest indices
    const indexKeys: Array<{ key: string; indexId: IndexId }> = [
        { key: 'strain', indexId: 'strain' },
        { key: 'withdrawalRisk', indexId: 'withdrawal_risk' },
        { key: 'trustGap', indexId: 'trust_gap' },
        { key: 'engagement', indexId: 'engagement' },
    ];

    const series = data.series || [];
    const indexKeyMap: Record<string, 'strain' | 'withdrawal' | 'trust' | 'engagement'> = {
        strain: 'strain',
        withdrawalRisk: 'withdrawal',
        trustGap: 'trust',
        engagement: 'engagement'
    };

    for (const { key, indexId } of indexKeys) {
        const latest = data.latestIndices[key];
        const seriesKey = indexKeyMap[key];

        const priorWeek = series.length > 1 && seriesKey
            ? series[series.length - 2]?.[seriesKey]
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
    const attribution: AttributionInput = {
        primarySource: data.attribution.primarySource as 'INTERNAL' | 'EXTERNAL' | 'MIXED' | null,
        internalDrivers: data.attribution.internalDrivers.map(d => ({
            driverFamily: d.driverFamily as DriverFamilyId,
            label: d.driverFamily, // InternalDriverAttribution doesn't have label, use ID
            contributionBand: (d.contributionBand as 'MAJOR' | 'MODERATE' | 'MINOR') || 'MODERATE',
            severityLevel: mapToSeverity(d.severity),
            trending: 'STABLE',
        })),
        externalDependencies: data.attribution.externalDependencies.map(d => ({
            dependency: d.dependency,
            impactLevel: mapToImpact(d.impact),
            pathway: d.pathway,
            controllability: 'PARTIAL',
        })),
        propagationRisk: data.attribution.propagationRisk
            ? {
                level: data.attribution.propagationRisk.level as 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE',
                drivers: [...data.attribution.propagationRisk.drivers]
            }
            : null,
    };

    // Build quality
    const quality: DataQualityInput = {
        coverageRatio: data.quality.coverage,
        confidenceProxy: data.quality.confidence,
        volatility: 0.3,  // TODO: derive from series if available
        sampleSize: null,
        missingWeeks: data.quality.missingWeeks,
    };

    // Build trend regime
    const trend: TrendRegimeInput = {
        regime: data.trend.regime as 'STABLE' | 'SHIFT' | 'NOISE',
        consistency: 1 - data.trend.volatility,
        weeksCovered: data.meta.weeksAvailable || series.length || 0,
    };

    return {
        orgId: data.meta.orgId || 'unknown-org',
        teamId: data.meta.teamId || data.id,
        weekStart: data.meta.latestWeek,
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

/**
 * TEAM READER — Read Team Dashboard Data from Weekly Products
 * 
 * Pure read layer that assembles DTO-ready data from Phase 6 outputs.
 * NO computation, NO LLM calls, NO mutation.
 */

import { query } from '@/db/client';
import { getQualitativeStateForIndex, getIndexDefinition, IndexId, INDEX_REGISTRY } from '@/lib/semantics/indexRegistry';
import { DRIVER_REGISTRY, DriverFamilyId, isValidDriverFamilyId } from '@/lib/semantics/driverRegistry';
import { COMPUTE_VERSION } from '@/services/pipeline/schema';
import { assertSameOrg } from '@/lib/tenancy/assertions';

// ============================================================================
// Types
// ============================================================================

export interface WeeklyProductRow {
    orgId: string;
    teamId: string;
    weekStart: string;
    computeVersion: string | null;
    inputHash: string | null;
    teamState: any;
    indices: Record<string, number>;
    quality: any;
    series: any;
    attribution: any[];
    updatedAt: Date;
    // Legacy columns
    parameterMeans: Record<string, number>;
    parameterUncertainty: Record<string, number>;
    contributionsBreakdown: any;
}

export interface TeamDashboardData {
    meta: {
        orgId: string;
        teamId: string;
        latestWeek: string;
        weeksAvailable: number;
        computeVersion: string;
        cacheHit: boolean;
        lastProductAt: string | null;
        lastInterpretationAt: string | null;
        inputHash: string | null;
    };
    latestIndices: {
        strain: { value: number; qualitative: string; label: string };
        withdrawalRisk: { value: number; qualitative: string; label: string };
        trustGap: { value: number; qualitative: string; label: string };
        engagement: { value: number; qualitative: string; label: string };
    };
    trend: {
        direction: 'UP' | 'DOWN' | 'STABLE';
        volatility: number;
        regime: string;
    };
    attribution: {
        primarySource: 'INTERNAL' | 'EXTERNAL' | 'MIXED' | null;
        internalDrivers: Array<{
            driverFamily: string;
            label: string;
            contributionBand: string;
            severityLevel: string;
        }>;
        externalDependencies: Array<{
            dependency: string;
            impactLevel: string;
            pathway: string;
        }>;
        propagationRisk: {
            level: string;
            drivers: string[];
        } | null;
    };
    quality: {
        coverage: number;
        confidence: number;
        stability: string;
        missingWeeks: number;
    };
    series: Array<{
        weekStart: string;
        strain: number;
        withdrawalRisk: number;
        trustGap: number;
        engagement: number;
    }>;
    weeklySummary: string | null;
}

// ============================================================================
// Main Reader
// ============================================================================

/**
 * Get team dashboard data for the last N weeks.
 */
export async function getTeamDashboardData(
    orgId: string,
    teamId: string,
    weeksBack: number = 9
): Promise<TeamDashboardData | null> {
    // Fetch weekly products
    const result = await query(
        `SELECT 
       org_id, team_id, week_start,
       compute_version, input_hash,
       team_state, indices, quality, series, attribution,
       parameter_means, parameter_uncertainty, contributions_breakdown,
       updated_at
     FROM org_aggregates_weekly
     WHERE org_id = $1 AND team_id = $2
     ORDER BY week_start DESC
     LIMIT $3`,
        [orgId, teamId, weeksBack]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const rows = result.rows.map(mapRow);
    const latest = rows[0];

    // Tenant Isolation Check
    assertSameOrg(orgId, latest.orgId, 'getTeamDashboardData');

    // Build latest indices
    const latestIndices = buildLatestIndices(latest);

    // Build trend from team_state
    const trend = buildTrend(latest.teamState);

    // Build attribution from latest
    const attribution = buildAttribution(latest.attribution);

    // Build quality metrics
    const quality = buildQuality(latest.quality, rows.length, weeksBack);

    // Build series
    const series = buildSeries(rows);

    return {
        meta: {
            orgId,
            teamId,
            latestWeek: latest.weekStart,
            weeksAvailable: rows.length,
            computeVersion: latest.computeVersion || 'legacy',
            cacheHit: false,
            lastProductAt: latest.updatedAt.toISOString(),
            lastInterpretationAt: null, // Filled by API route if available
            inputHash: latest.inputHash,
        },
        latestIndices,
        trend,
        attribution,
        quality,
        series,
        weeklySummary: null, // Stored separately, not yet implemented
    };
}

/**
 * Get team name from database.
 */
export async function getTeamName(teamId: string): Promise<string> {
    const result = await query(
        `SELECT name FROM teams WHERE team_id = $1`,
        [teamId]
    );
    return result.rows[0]?.name || 'Unknown Team';
}

// ============================================================================
// Helpers
// ============================================================================

function mapRow(row: any): WeeklyProductRow {
    return {
        orgId: row.org_id,
        teamId: row.team_id,
        weekStart: new Date(row.week_start).toISOString().slice(0, 10),
        computeVersion: row.compute_version,
        inputHash: row.input_hash,
        teamState: row.team_state || {},
        indices: row.indices || {},
        quality: row.quality || {},
        series: row.series || {},
        attribution: row.attribution || [],
        updatedAt: new Date(row.updated_at),
        parameterMeans: row.parameter_means || {},
        parameterUncertainty: row.parameter_uncertainty || {},
        contributionsBreakdown: row.contributions_breakdown || {},
    };
}

function buildLatestIndices(row: WeeklyProductRow): TeamDashboardData['latestIndices'] {
    const getIndexData = (key: IndexId): { value: number; qualitative: string; label: string } => {
        const value = row.indices[key] ?? 0.5;
        const def = getIndexDefinition(key);
        const qualitative = getQualitativeStateForIndex(key, value);
        return {
            value,
            qualitative,
            label: def.displayName,
        };
    };

    return {
        strain: getIndexData('strain'),
        withdrawalRisk: getIndexData('withdrawal_risk'),
        trustGap: getIndexData('trust_gap'),
        engagement: getIndexData('engagement'),
    };
}

function buildTrend(teamState: any): TeamDashboardData['trend'] {
    if (!teamState) {
        return { direction: 'STABLE', volatility: 0, regime: 'NOISE' };
    }

    return {
        direction: teamState.trendDir || 'STABLE',
        volatility: teamState.volatility || 0,
        regime: teamState.regime || 'NOISE',
    };
}

function buildAttribution(attribution: any[]): TeamDashboardData['attribution'] {
    if (!attribution || attribution.length === 0) {
        return {
            primarySource: null,
            internalDrivers: [],
            externalDependencies: [],
            propagationRisk: null,
        };
    }

    // Take first attribution result (typically for strain)
    const first = attribution[0];
    if (!first) {
        return {
            primarySource: null,
            internalDrivers: [],
            externalDependencies: [],
            propagationRisk: null,
        };
    }

    return {
        primarySource: first.primarySource || null,
        internalDrivers: (first.internal || []).map((d: any) => {
            const family = d.driverFamily as DriverFamilyId;
            return {
                driverFamily: d.driverFamily,
                label: isValidDriverFamilyId(family) ? DRIVER_REGISTRY[family].displayName : d.driverFamily,
                contributionBand: d.contributionBand,
                severityLevel: d.severityLevel,
            };
        }),
        externalDependencies: (first.external || []).map((d: any) => ({
            dependency: d.dependency,
            impactLevel: d.impactLevel,
            pathway: d.pathway,
        })),
        propagationRisk: first.propagationRisk || null,
    };
}

function buildQuality(quality: any, weeksAvailable: number, weeksRequested: number): TeamDashboardData['quality'] {
    return {
        coverage: quality?.coverageRatio ?? (weeksAvailable / weeksRequested),
        confidence: quality?.meanConfidence ?? 0.7,
        stability: quality?.stability ?? 'MED',
        missingWeeks: weeksRequested - weeksAvailable,
    };
}

function buildSeries(rows: WeeklyProductRow[]): TeamDashboardData['series'] {
    // Sort chronologically (oldest first)
    const sorted = [...rows].sort((a, b) =>
        new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
    );

    return sorted.map(row => ({
        weekStart: row.weekStart,
        strain: row.indices.strain ?? 0.5,
        withdrawalRisk: row.indices.withdrawal_risk ?? 0.5,
        trustGap: row.indices.trust_gap ?? 0.5,
        engagement: row.indices.engagement ?? 0.5,
    }));
}

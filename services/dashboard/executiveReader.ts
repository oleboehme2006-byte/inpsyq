/**
 * EXECUTIVE READER — Read Executive Dashboard Data from Weekly Products
 * 
 * Aggregates team data for org-level view.
 * NO computation, NO LLM calls, NO mutation.
 */

import { query } from '@/db/client';
import { getTeamDashboardData, getTeamName, TeamDashboardData } from './teamReader';

// ============================================================================
// Types
// ============================================================================

export interface TeamSummaryData {
    teamId: string;
    teamName: string;
    stateLabel: 'HEALTHY' | 'AT_RISK' | 'CRITICAL' | 'UNKNOWN';
    strainValue: number;
    strainQualitative: string;
    trendDirection: 'UP' | 'DOWN' | 'STABLE';
    weeksAvailable: number;
}

export interface ExecutiveDashboardData {
    meta: {
        orgId: string;
        latestWeek: string;
        teamsCount: number;
        weeksAvailable: number;
        cacheHit: boolean;
    };
    orgIndices: {
        strain: { value: number; qualitative: string };
        withdrawalRisk: { value: number; qualitative: string };
        trustGap: { value: number; qualitative: string };
        engagement: { value: number; qualitative: string };
    };
    orgTrend: {
        direction: 'UP' | 'DOWN' | 'STABLE';
        volatility: number;
    };
    riskDistribution: {
        critical: number;
        atRisk: number;
        healthy: number;
    };
    teams: TeamSummaryData[];
    systemicDrivers: Array<{
        driverFamily: string;
        label: string;
        affectedTeams: number;
        aggregateImpact: number;
    }>;
    watchlist: Array<{
        teamId: string;
        teamName: string;
        reason: string;
        severity: number;
    }>;
}

// ============================================================================
// Main Reader
// ============================================================================

/**
 * Get executive dashboard data for an org.
 */
export async function getExecutiveDashboardData(
    orgId: string,
    weeksBack: number = 9
): Promise<ExecutiveDashboardData | null> {
    // Get all teams in org
    const teamsResult = await query(
        `SELECT team_id, name FROM teams WHERE org_id = $1`,
        [orgId]
    );

    if (teamsResult.rows.length === 0) {
        return null;
    }

    // Fetch dashboard data for each team
    const teamDataPromises = teamsResult.rows.map(async (team) => {
        const data = await getTeamDashboardData(orgId, team.team_id, weeksBack);
        return { teamId: team.team_id, teamName: team.name, data };
    });

    const teamsWithData = await Promise.all(teamDataPromises);
    const validTeams = teamsWithData.filter(t => t.data !== null);

    if (validTeams.length === 0) {
        return null;
    }

    // Aggregate org-level indices (average across teams)
    const orgIndices = aggregateOrgIndices(validTeams.map(t => t.data!));

    // Aggregate org trend
    const orgTrend = aggregateOrgTrend(validTeams.map(t => t.data!));

    // Build risk distribution
    const riskDistribution = buildRiskDistribution(validTeams.map(t => t.data!));

    // Build team summaries
    const teams: TeamSummaryData[] = validTeams.map(t => ({
        teamId: t.teamId,
        teamName: t.teamName,
        stateLabel: getStateLabel(t.data!.latestIndices.strain.value),
        strainValue: t.data!.latestIndices.strain.value,
        strainQualitative: t.data!.latestIndices.strain.qualitative,
        trendDirection: t.data!.trend.direction,
        weeksAvailable: t.data!.meta.weeksAvailable,
    }));

    // Aggregate systemic drivers
    const systemicDrivers = aggregateSystemicDrivers(validTeams.map(t => t.data!));

    // Build watchlist
    const watchlist = buildWatchlist(teams);

    // Find latest week
    const latestWeek = validTeams
        .map(t => t.data!.meta.latestWeek)
        .sort()
        .reverse()[0];

    return {
        meta: {
            orgId,
            latestWeek,
            teamsCount: validTeams.length,
            weeksAvailable: Math.max(...validTeams.map(t => t.data!.meta.weeksAvailable)),
            cacheHit: false,
        },
        orgIndices,
        orgTrend,
        riskDistribution,
        teams,
        systemicDrivers,
        watchlist,
    };
}

// ============================================================================
// Helpers
// ============================================================================

function aggregateOrgIndices(teamData: TeamDashboardData[]): ExecutiveDashboardData['orgIndices'] {
    const avg = (key: keyof TeamDashboardData['latestIndices']) => {
        const values = teamData.map(t => t.latestIndices[key].value);
        const sum = values.reduce((a, b) => a + b, 0);
        return sum / values.length;
    };

    const getQualitative = (value: number): string => {
        if (value >= 0.75) return 'Critical';
        if (value >= 0.5) return 'Elevated';
        if (value >= 0.25) return 'Moderate';
        return 'Low';
    };

    const strainVal = avg('strain');
    const wrVal = avg('withdrawalRisk');
    const tgVal = avg('trustGap');
    const engVal = avg('engagement');

    return {
        strain: { value: strainVal, qualitative: getQualitative(strainVal) },
        withdrawalRisk: { value: wrVal, qualitative: getQualitative(wrVal) },
        trustGap: { value: tgVal, qualitative: getQualitative(tgVal) },
        engagement: { value: engVal, qualitative: getQualitative(1 - engVal) }, // Inverse for engagement
    };
}

function aggregateOrgTrend(teamData: TeamDashboardData[]): ExecutiveDashboardData['orgTrend'] {
    const directions = teamData.map(t => t.trend.direction);
    const volatilities = teamData.map(t => t.trend.volatility);

    const upCount = directions.filter(d => d === 'UP').length;
    const downCount = directions.filter(d => d === 'DOWN').length;

    let direction: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (upCount > teamData.length / 2) direction = 'UP';
    else if (downCount > teamData.length / 2) direction = 'DOWN';

    const avgVolatility = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;

    return { direction, volatility: avgVolatility };
}

function buildRiskDistribution(teamData: TeamDashboardData[]): ExecutiveDashboardData['riskDistribution'] {
    let critical = 0;
    let atRisk = 0;
    let healthy = 0;

    for (const t of teamData) {
        const strain = t.latestIndices.strain.value;
        if (strain >= 0.75) critical++;
        else if (strain >= 0.5) atRisk++;
        else healthy++;
    }

    return { critical, atRisk, healthy };
}

function getStateLabel(strain: number): 'HEALTHY' | 'AT_RISK' | 'CRITICAL' | 'UNKNOWN' {
    if (strain >= 0.75) return 'CRITICAL';
    if (strain >= 0.5) return 'AT_RISK';
    return 'HEALTHY';
}

function aggregateSystemicDrivers(teamData: TeamDashboardData[]): ExecutiveDashboardData['systemicDrivers'] {
    const driverCounts: Record<string, { label: string; count: number; totalImpact: number }> = {};

    for (const t of teamData) {
        for (const d of t.attribution.internalDrivers) {
            if (!driverCounts[d.driverFamily]) {
                driverCounts[d.driverFamily] = { label: d.label, count: 0, totalImpact: 0 };
            }
            driverCounts[d.driverFamily].count++;
            driverCounts[d.driverFamily].totalImpact += d.contributionBand === 'MAJOR' ? 1 : 0.5;
        }
    }

    return Object.entries(driverCounts)
        .filter(([_, v]) => v.count >= 2) // Only systemic if affects 2+ teams
        .map(([family, v]) => ({
            driverFamily: family,
            label: v.label,
            affectedTeams: v.count,
            aggregateImpact: v.totalImpact / teamData.length,
        }))
        .sort((a, b) => b.affectedTeams - a.affectedTeams)
        .slice(0, 5);
}

function buildWatchlist(teams: TeamSummaryData[]): ExecutiveDashboardData['watchlist'] {
    return teams
        .filter(t => t.stateLabel === 'CRITICAL' || t.stateLabel === 'AT_RISK')
        .map(t => ({
            teamId: t.teamId,
            teamName: t.teamName,
            reason: t.stateLabel === 'CRITICAL'
                ? 'Strain exceeds critical threshold'
                : 'Strain elevated, requires attention',
            severity: t.strainValue,
        }))
        .sort((a, b) => b.severity - a.severity)
        .slice(0, 5);
}

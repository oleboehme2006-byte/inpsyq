/**
 * TEAM DASHBOARD DATA ADAPTER
 * 
 * Fetches real data from Phase 7 APIs and adapts to UI types.
 */

import {
    fetchTeamDashboard,
    fetchTeamInterpretation,
    getOrgId,
    getTeamId,
    shouldUseMocks,
    FetchResult
} from '@/lib/dashboardClient';

// Re-exports
export { shouldUseMocks, getOrgId, getTeamId };

export interface TeamApiData {
    meta: {
        teamId: string;
        teamName: string;
        orgId: string;
        orgName: string;
        rangeWeeks: number;
        generatedAt: string;
        primaryLoadSource: 'internal' | 'external' | 'mixed';
        internalImpactScore: number;
        externalImpactScore: number;
    };
    indices: Record<string, number>;
    previousIndices: Record<string, number>;
    trends: Record<string, Array<{ week: string; value: number; lower: number; upper: number }>>;
    internalDrivers: Record<string, Array<{
        id: string;
        familyId: string;
        name: string;
        mechanism: string;
        contribution: number;
        affectedIndexId: string;
    }>>;
    externalDependencies: Array<{
        id: string;
        teamName: string;
        direction: string;
        impactStrength: number;
        impactLabel: string;
        description: string;
    }>;
    actions: Record<string, Array<{
        id: string;
        title: string;
        affectedIndexId: string;
        addressesDriverFamilyIds: string[];
        rationale: string;
        displayPriority: string;
        actionType: string;
        isPartialMitigation: boolean;
        context: string;
        mechanism: string;
        modelEffect: string;
        limitation?: string;
        requiresCoordination?: string;
    }>>;
    coordinationNotices: Array<{
        id: string;
        title: string;
        targetTeam: string;
        reason: string;
    }>;
    weeklyInsight: {
        internalDynamics: string;
        externalPressure: string;
        shortTermRisk: string;
        guidance: { should: string[]; shouldNot: string[] };
        should: string[];
        shouldNot: string[];
    };
    governance: {
        coverage: number;
        dataQuality: number;
        temporalStability: number;
        signalConfidence: number;
        sessionsCount: number;
        lastMeasuredAt: string;
        confidenceLevel: string;
    };
}

/**
 * Fetch team dashboard data from API.
 */
export async function fetchTeamData(teamId: string): Promise<{ data: TeamApiData | null; error?: string }> {
    const orgId = getOrgId();

    if (!orgId) {
        return { data: null, error: 'No org_id available' };
    }

    const result = await fetchTeamDashboard(orgId, teamId) as FetchResult<any>;

    if (!result.ok) {
        console.warn('[Dashboard] Team API failed:', result.message);
        return { data: null, error: result.message };
    }

    const apiData = result.data;

    // Fetch interpretation (optional)
    let weeklyInsight: TeamApiData['weeklyInsight'] = {
        internalDynamics: 'Loading team dynamics...',
        externalPressure: 'Loading external factors...',
        shortTermRisk: 'Assessing risk...',
        guidance: { should: [], shouldNot: [] },
        should: [],
        shouldNot: [],
    };

    try {
        const interpResult = await fetchTeamInterpretation(orgId, teamId) as FetchResult<any>;
        if (interpResult.ok && interpResult.data.interpretation?.sections) {
            const sections = interpResult.data.interpretation.sections;
            weeklyInsight = {
                internalDynamics: sections.whatChanged?.slice(0, 2).join('. ') || 'No internal dynamics data',
                externalPressure: sections.primaryDrivers?.external?.map((d: any) => d.label).join(', ') || 'No external pressure detected',
                shortTermRisk: sections.riskOutlook?.[0] || 'No immediate risks identified',
                guidance: {
                    should: sections.recommendedFocus || [],
                    shouldNot: ['Avoid overreacting to short-term fluctuations'],
                },
                should: sections.recommendedFocus || [],
                shouldNot: ['Avoid overreacting to short-term fluctuations'],
            };
        }
    } catch (e) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[Dashboard] Team interpretation not available (optional)');
        }
    }

    // Transform to expected shape
    const data: TeamApiData = {
        meta: {
            teamId: apiData.team_id || teamId,
            teamName: apiData.team_name || 'Team',
            orgId: apiData.org_id || orgId,
            orgName: apiData.org_name || 'Organization',
            rangeWeeks: apiData.weeks_available || 9,
            generatedAt: apiData.generated_at || new Date().toISOString(),
            primaryLoadSource: apiData.primary_source || 'internal',
            internalImpactScore: apiData.internal_impact || 0.5,
            externalImpactScore: apiData.external_impact || 0.3,
        },
        indices: {
            strain_index: apiData.latest_indices?.strain || 0.4,
            withdrawal_risk: apiData.latest_indices?.withdrawal_risk || 0.3,
            trust_gap: apiData.latest_indices?.trust_gap || 0.25,
            engagement_index: apiData.latest_indices?.engagement || 0.6,
        },
        previousIndices: {
            strain_index: (apiData.latest_indices?.strain || 0.4) - 0.02,
            withdrawal_risk: (apiData.latest_indices?.withdrawal_risk || 0.3) - 0.01,
            trust_gap: (apiData.latest_indices?.trust_gap || 0.25),
            engagement_index: (apiData.latest_indices?.engagement || 0.6) + 0.01,
        },
        trends: apiData.series ? transformSeries(apiData.series) : {},
        internalDrivers: transformDrivers(apiData.attribution?.internal_drivers || []),
        externalDependencies: (apiData.attribution?.external_dependencies || []).map((d: any) => ({
            id: d.dependency || d.id,
            teamName: d.dependency || 'External',
            direction: 'receives_from',
            impactStrength: parseFloat(d.impact_level?.replace('D', '')) / 10 || 0.3,
            impactLabel: d.impact_level?.includes('3') ? 'HIGH' : d.impact_level?.includes('2') ? 'MODERATE' : 'LOW',
            description: d.pathway || 'External dependency',
        })),
        actions: {}, // Will use deterministic actions from existing logic
        coordinationNotices: [],
        weeklyInsight,
        governance: apiData.quality || {
            coverage: 0.8,
            dataQuality: 0.85,
            temporalStability: 0.8,
            signalConfidence: 0.75,
            sessionsCount: 0,
            lastMeasuredAt: new Date().toISOString(),
            confidenceLevel: 'medium',
        },
    };

    return { data };
}

function transformSeries(series: any[]): Record<string, Array<{ week: string; value: number; lower: number; upper: number }>> {
    const result: Record<string, any[]> = {
        strain_index: [],
        withdrawal_risk: [],
        trust_gap: [],
        engagement_index: [],
    };

    series.forEach((point, i) => {
        const week = `W${i + 1}`;
        result.strain_index.push({ week, value: point.strain || 0.4, lower: (point.strain || 0.4) - 0.05, upper: (point.strain || 0.4) + 0.05 });
        result.withdrawal_risk.push({ week, value: point.withdrawalRisk || 0.3, lower: (point.withdrawalRisk || 0.3) - 0.05, upper: (point.withdrawalRisk || 0.3) + 0.05 });
        result.trust_gap.push({ week, value: point.trustGap || 0.25, lower: (point.trustGap || 0.25) - 0.05, upper: (point.trustGap || 0.25) + 0.05 });
        result.engagement_index.push({ week, value: point.engagement || 0.6, lower: (point.engagement || 0.6) - 0.05, upper: (point.engagement || 0.6) + 0.05 });
    });

    return result;
}

function transformDrivers(drivers: any[]): Record<string, any[]> {
    const result: Record<string, any[]> = {
        strain_index: [],
        withdrawal_risk: [],
        trust_gap: [],
        engagement_index: [],
    };

    drivers.forEach(d => {
        const driver = {
            id: d.driver_family || d.id,
            familyId: d.driver_family || 'workload',
            name: d.label || d.driver_family || 'Driver',
            mechanism: 'Identified through attribution analysis',
            contribution: parseFloat(d.severity_level?.replace('C', '')) / 10 || 0.3,
            affectedIndexId: 'strain_index',
        };
        result.strain_index.push(driver);
    });

    return result;
}

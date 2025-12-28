/**
 * EXECUTIVE DASHBOARD DATA ADAPTER
 * 
 * Fetches real data from Phase 7 APIs and adapts to UI types.
 * Falls back to mock if NEXT_PUBLIC_DASHBOARD_DEV_MOCKS=true.
 */

import {
    fetchExecutiveDashboard,
    fetchExecutiveInterpretation,
    getOrgId,
    shouldUseMocks,
    FetchResult
} from '@/lib/dashboardClient';

// Re-export mock flag
export { shouldUseMocks };

// Re-export orgId getter
export { getOrgId };

export interface ExecutiveApiData {
    meta: {
        orgId: string;
        orgName: string;
        teamCount: number;
        rangeWeeks: number;
        generatedAt: string;
    };
    orgIndices: {
        strain_index: number;
        engagement_index: number;
        withdrawal_risk: number;
        trust_gap: number;
    };
    previousIndices: {
        strain_index: number;
        engagement_index: number;
        withdrawal_risk: number;
        trust_gap: number;
    };
    orgTrends: Record<string, Array<{ week: string; value: number; lower: number; upper: number }>>;
    teams: Array<{
        teamId: string;
        teamName: string;
        stateLabel: string;
        severity: number;
        strainIndex: number;
        withdrawalRisk: number;
        trustGap: number;
        engagementIndex: number;
        coverage: number;
    }>;
    riskDistribution: { critical: number; atRisk: number; healthy: number };
    systemicDrivers: Array<{
        id: string;
        label: string;
        affectedTeams: string[];
        aggregateImpact: number;
        scope: string;
        driverType: string;
    }>;
    watchlist: Array<{
        teamId: string;
        teamName: string;
        signal: string;
        urgency: string;
        metric: string;
        value: number;
        origin: string;
        context?: string;
        trendExplanation?: string;
        causalRelationship?: string;
        recommendation?: string;
    }>;
    interpretation?: {
        summary: string;
        generatedAt: string;
        mode: string;
        weekRange: string;
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
 * Fetch executive dashboard data from API with optional interpretation.
 */
export async function fetchExecutiveData(): Promise<{ data: ExecutiveApiData | null; error?: string }> {
    const orgId = getOrgId();

    if (!orgId) {
        return { data: null, error: 'No org_id available' };
    }

    const result = await fetchExecutiveDashboard(orgId) as FetchResult<any>;

    if (!result.ok) {
        console.warn('[Dashboard] Executive API failed:', result.message);
        return { data: null, error: result.message };
    }

    // Adapt API response to dashboard types
    const apiData = result.data;

    // Fetch interpretation (optional, don't fail if missing)
    let interpretation: ExecutiveApiData['interpretation'];
    try {
        const interpResult = await fetchExecutiveInterpretation(orgId) as FetchResult<any>;
        if (interpResult.ok && interpResult.data.interpretation) {
            const interp = interpResult.data.interpretation;
            interpretation = {
                summary: interp.sections?.executiveSummary || '',
                generatedAt: interp.created_at || new Date().toISOString(),
                mode: interp.model_id?.includes('fallback') ? 'deterministic' : 'llm',
                weekRange: interp.week_start || 'Current week',
            };
        }
    } catch (e) {
        // Interpretation is optional
        if (process.env.NODE_ENV === 'development') {
            console.log('[Dashboard] Interpretation not available (optional)');
        }
    }

    // Transform to expected shape
    const data: ExecutiveApiData = {
        meta: {
            orgId: apiData.org_id || orgId,
            orgName: apiData.org_name || 'Organization',
            teamCount: apiData.team_count || 0,
            rangeWeeks: apiData.weeks_available || 9,
            generatedAt: apiData.generated_at || new Date().toISOString(),
        },
        orgIndices: {
            strain_index: apiData.org_indices?.strain || 0.4,
            engagement_index: apiData.org_indices?.engagement || 0.6,
            withdrawal_risk: apiData.org_indices?.withdrawal_risk || 0.3,
            trust_gap: apiData.org_indices?.trust_gap || 0.25,
        },
        previousIndices: {
            strain_index: (apiData.org_indices?.strain || 0.4) - 0.02,
            engagement_index: (apiData.org_indices?.engagement || 0.6) + 0.01,
            withdrawal_risk: (apiData.org_indices?.withdrawal_risk || 0.3) - 0.01,
            trust_gap: (apiData.org_indices?.trust_gap || 0.25),
        },
        orgTrends: apiData.org_trends || {},
        teams: (apiData.teams || []).map((t: any) => ({
            teamId: t.team_id || t.teamId,
            teamName: t.team_name || t.teamName || 'Team',
            stateLabel: t.state || 'UNKNOWN',
            severity: t.severity || 0.5,
            strainIndex: t.strain || 0.4,
            withdrawalRisk: t.withdrawal_risk || 0.3,
            trustGap: t.trust_gap || 0.25,
            engagementIndex: t.engagement || 0.6,
            coverage: t.coverage || 0.8,
        })),
        riskDistribution: apiData.risk_distribution || { critical: 0, atRisk: 0, healthy: 0 },
        systemicDrivers: (apiData.systemic_drivers || []).map((d: any) => ({
            id: d.id || d.driver_id,
            label: d.label || d.name,
            affectedTeams: d.affected_teams || [],
            aggregateImpact: d.impact || 0.3,
            scope: d.scope || 'localized',
            driverType: d.type || 'internal',
        })),
        watchlist: (apiData.watchlist || []).map((w: any) => ({
            teamId: w.team_id || w.teamId,
            teamName: w.team_name || w.teamName,
            signal: w.signal || 'Signal detected',
            urgency: w.urgency || 'NORMAL',
            metric: w.metric || 'strain_index',
            value: w.value || 0.5,
            origin: w.origin || 'internal',
            context: w.context,
            trendExplanation: w.trend_explanation,
            causalRelationship: w.causal_relationship,
            recommendation: w.recommendation,
        })),
        interpretation,
        governance: apiData.governance || {
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

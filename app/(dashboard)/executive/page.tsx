import React from 'react';
import { ExecutiveClientWrapper } from '@/components/dashboard/executive/ExecutiveClientWrapper';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default async function ExecutiveDashboard() {
    if (DEMO_MODE) {
        // Demo mode: skip auth + DB — the wrapper generates all data internally
        const demoData = {
            meta: { orgId: 'demo', latestWeek: '', teamsCount: 6, weeksAvailable: 12, cacheHit: false },
            orgIndices: {
                strain: { value: 0.35, qualitative: 'Moderate' },
                withdrawalRisk: { value: 0.25, qualitative: 'Low' },
                trustGap: { value: 0.30, qualitative: 'Moderate' },
                engagement: { value: 0.65, qualitative: 'Moderate' },
            },
            orgTrend: { direction: 'UP' as const, volatility: 0.12 },
            riskDistribution: { critical: 1, atRisk: 2, healthy: 3 },
            teams: [],
            systemicDrivers: [],
            watchlist: [],
            history: [],
        };
        return <ExecutiveClientWrapper initialData={demoData} />;
    }

    // Production with fallback to Demo
    const { resolveAuthContext } = await import('@/lib/auth/context');
    const { getExecutiveDashboardData } = await import('@/services/dashboard/executiveReader');
    const { getOrCreateOrgInterpretation } = await import('@/services/interpretation/service');

    const auth = await resolveAuthContext();

    // Fallback to Demo Data if not authenticated
    if (!auth.context?.orgId) {
        const demoData = {
            meta: { orgId: 'demo', latestWeek: new Date().toISOString(), teamsCount: 6, weeksAvailable: 12, cacheHit: false },
            orgIndices: {
                strain: { value: 0.35, qualitative: 'Moderate' },
                withdrawalRisk: { value: 0.25, qualitative: 'Low' },
                trustGap: { value: 0.30, qualitative: 'Moderate' },
                engagement: { value: 0.65, qualitative: 'Moderate' },
            },
            orgTrend: { direction: 'UP' as const, volatility: 0.12 },
            riskDistribution: { critical: 1, atRisk: 2, healthy: 3 },
            teams: [
                { teamId: 'product', teamName: 'Product', stateLabel: 'CRITICAL', strainValue: 0.78, strainQualitative: 'High', trendDirection: 'UP', weeksAvailable: 12 },
                { teamId: 'engineering', teamName: 'Engineering', stateLabel: 'AT_RISK', strainValue: 0.65, strainQualitative: 'Moderate', trendDirection: 'UP', weeksAvailable: 12 },
                { teamId: 'sales', teamName: 'Sales', stateLabel: 'AT_RISK', strainValue: 0.45, strainQualitative: 'Moderate', trendDirection: 'UP', weeksAvailable: 12 },
                { teamId: 'marketing', teamName: 'Marketing', stateLabel: 'HEALTHY', strainValue: 0.22, strainQualitative: 'Low', trendDirection: 'STABLE', weeksAvailable: 12 },
                { teamId: 'ops', teamName: 'Operations', stateLabel: 'HEALTHY', strainValue: 0.18, strainQualitative: 'Low', trendDirection: 'DOWN', weeksAvailable: 12 },
                { teamId: 'hr', teamName: 'HR', stateLabel: 'HEALTHY', strainValue: 0.15, strainQualitative: 'Low', trendDirection: 'STABLE', weeksAvailable: 12 },
            ],
            systemicDrivers: [],
            watchlist: [],
            history: [],
        };
        // @ts-ignore - Demo data alignment
        return <ExecutiveClientWrapper initialData={demoData} />;
    }

    const data = await getExecutiveDashboardData(auth.context.orgId);
    if (!data) return <div>No Data Available. Run seed:demo?</div>;

    // Fetch Interpretation
    let interpretation = null;
    try {
        const interpResult = await getOrCreateOrgInterpretation(auth.context.orgId, data.meta.latestWeek);
        interpretation = interpResult.record;
    } catch (e) {
        console.error('Failed to load interpretation:', e);
    }

    return <ExecutiveClientWrapper initialData={data} interpretation={interpretation} />;
}

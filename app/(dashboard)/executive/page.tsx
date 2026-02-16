import React from 'react';
import { ExecutiveClientWrapper } from '@/components/dashboard/executive/ExecutiveClientWrapper';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default async function ExecutiveDashboard() {
    // Check auth state
    const { resolveAuthContext } = await import('@/lib/auth/context');
    const auth = await resolveAuthContext();

    // IF DEMO_MODE or Unauthenticated -> Show Demo Data
    if (DEMO_MODE || !auth.authenticated) {
        // Demo mode / Public Preview: generate internal demo data
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

    // Production with auth
    const { getExecutiveDashboardData } = await import('@/services/dashboard/executiveReader');
    const { getOrCreateOrgInterpretation } = await import('@/services/interpretation/service');

    if (!auth.context?.orgId) return <div>No Organization Selected</div>;

    const data = await getExecutiveDashboardData(auth.context.orgId);
    if (!data) return <div>No Data Available. Run seed:demo?</div>;

    // Fetch Intepretation
    let interpretation = null;
    try {
        const interpResult = await getOrCreateOrgInterpretation(auth.context.orgId, data.meta.latestWeek);
        interpretation = interpResult.record;
    } catch (e) {
        console.error('Failed to load interpretation:', e);
    }

    return <ExecutiveClientWrapper initialData={data} interpretation={interpretation} />;
}

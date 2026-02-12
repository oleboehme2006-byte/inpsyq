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
        };
        return <ExecutiveClientWrapper initialData={demoData} />;
    }

    // Production with auth
    const { resolveAuthContext } = await import('@/lib/auth/context');
    const { getExecutiveDashboardData } = await import('@/services/dashboard/executiveReader');

    const auth = await resolveAuthContext();
    if (!auth.context?.orgId) return <div>No Organization Selected</div>;

    const data = await getExecutiveDashboardData(auth.context.orgId);
    if (!data) return <div>No Data Available. Run seed:demo?</div>;

    return <ExecutiveClientWrapper initialData={data} />;
}

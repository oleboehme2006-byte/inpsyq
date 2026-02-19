import React from 'react';
import { ExecutiveClientWrapper } from '@/components/dashboard/executive/ExecutiveClientWrapper';
import type { ExecutiveDashboardData } from '@/services/dashboard/executiveReader';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default async function ExecutiveDashboard() {
    if (DEMO_MODE) {
        // Demo mode: skip auth + DB — components use their internal mock data as fallback
        const demoData: ExecutiveDashboardData = {
            orgName: 'Acme Corporation',
            kpis: [],      // ExecutiveClientWrapper generates its own KPIs from graphData
            teams: [],     // TeamPortfolioTable has internal mock data
            drivers: [],   // SystemicDrivers falls back to executiveMockData
            watchlist: [], // Watchlist falls back to executiveMockData
            briefingParagraphs: [], // Briefing falls back to hardcoded paragraphs
            governance: {
                coverage: 85,
                dataQuality: 78,
                totalSessions: 156,
                lastUpdated: 'Dec 15, 2025',
            },
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

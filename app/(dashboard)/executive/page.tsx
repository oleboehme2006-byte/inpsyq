import React from 'react';
import { getExecutiveDashboardData } from '@/services/dashboard/executiveReader'; // You might need to verify this import path
import { resolveAuthContext } from '@/lib/auth/context';
import { ExecutiveClientWrapper } from '@/components/dashboard/executive/ExecutiveClientWrapper';

export default async function ExecutiveDashboard() {
    // 1. Resolve Auth / Org
    const auth = await resolveAuthContext();
    if (!auth.context?.orgId) return <div>No Organization Selected</div>;

    const orgId = auth.context.orgId;

    // 2. Fetch Real Data
    const data = await getExecutiveDashboardData(orgId);

    if (!data) return <div>No Data Available. Run seed:demo?</div>;

    // 3. Map to UI format
    // (We might need to adjust the components to accept this DTO directly in the future,
    // but for now we map to the props they expect or wrap them)

    // Using a Client Wrapper to handle the interactive state (selectedKpi, etc.)
    return (
        <ExecutiveClientWrapper initialData={data} />
    );
}



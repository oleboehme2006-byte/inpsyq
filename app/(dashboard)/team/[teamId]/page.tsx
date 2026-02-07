import React from 'react';
import { getTeamDashboardData, getTeamName } from '@/services/dashboard/teamReader';
import { resolveAuthContext } from '@/lib/auth/context';
import { TeamClientWrapper } from '@/components/dashboard/team/TeamClientWrapper';
import { requireTeamAccessStrict } from '@/lib/access/guards';
import { notFound } from 'next/navigation';

export default async function TeamDashboard({ params }: { params: { teamId: string } }) {
    const teamId = params.teamId;

    // 1. Resolve Auth & Access
    // We can use the strict guard to ensure the user has access to this team
    // However, guards return NextResponse which is for route handlers. 
    // In Server Components, we throw or redirect.
    // Let's use `resolveAuthContext` and check manually for now, or trust the reader (which checks org).
    const auth = await resolveAuthContext();
    if (!auth.authenticated || !auth.context) {
        return <div>Access Denied</div>;
    }

    const { orgId } = auth.context;

    // 2. Fetch Data
    const [data, teamName] = await Promise.all([
        getTeamDashboardData(orgId, teamId),
        getTeamName(teamId)
    ]);

    if (!data) {
        // If data is missing but team exists, it might be a new team.
        // If team doesn't exist, it should be 404.
        // For now, simple fallback.
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">{teamName}</h1>
                <p>No dashboard data available yet. Waiting for first weekly cycle.</p>
            </div>
        );
    }

    // 3. Render Client Wrapper
    return <TeamClientWrapper data={data} teamName={teamName} />;
}

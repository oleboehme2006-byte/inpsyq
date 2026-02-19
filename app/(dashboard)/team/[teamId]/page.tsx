import { TeamClientWrapper } from '@/components/dashboard/team/TeamClientWrapper';

interface TeamPageProps {
    params: Promise<{ teamId: string }>;
}

import { auth } from '@clerk/nextjs/server';
import { getTeamDashboardData } from '@/services/dashboard/teamReader';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default async function TeamPage({ params }: TeamPageProps) {
    const { teamId } = await params;
    let initialData = null;

    if (!DEMO_MODE) {
        const { orgId } = await auth();
        if (orgId) {
            try {
                initialData = await getTeamDashboardData(orgId, teamId);
            } catch (error) {
                console.error('Failed to load team dashboard data:', error);
                // Fallback to null (client wrapper handles empty state)
            }
        }
    }

    return <TeamClientWrapper teamId={teamId} initialData={initialData} />;
}

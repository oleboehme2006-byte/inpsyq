import { TeamClientWrapper } from '@/components/dashboard/team/TeamClientWrapper';
import { getTeamDashboardData } from '@/services/dashboard/teamReader';
import { getOrCreateTeamInterpretation } from '@/services/interpretation/service';
import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';

interface TeamPageProps {
    params: { teamId: string };
}

export default async function TeamPage({ params }: TeamPageProps) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) redirect('/auth/sign-in');

    const [dashboardData, interpretation] = await Promise.all([
        getTeamDashboardData(orgId, params.teamId),
        getOrCreateTeamInterpretation(orgId, params.teamId)
    ]);

    if (!dashboardData) {
        notFound();
    }

    return (
        <TeamClientWrapper
            initialData={dashboardData}
            interpretation={interpretation.record}
        />
    );
}

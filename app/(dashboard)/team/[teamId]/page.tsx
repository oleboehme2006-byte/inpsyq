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

    // == FALLBACK: Demo Mode if not authenticated ==
    if (!userId || !orgId) {
        const { teamDashboardData } = await import('@/lib/mock/teamDashboardData');
        const teamKey = params.teamId.toLowerCase();
        const demoTeam = teamDashboardData[teamKey];

        if (demoTeam) {
            // Map Mock Entry -> TeamDashboardData (Client Interface)
            // We construct a synthetic object that matches what TeamReader returns
            const syntheticData = {
                meta: {
                    teamId: demoTeam.id,
                    teamName: demoTeam.name,
                    latestWeek: new Date().toISOString(),
                    weeksAvailable: 12, // Mock assumption
                },
                series: [], // Empty series for demo (graphs might be empty or client needs to handle it)
                kpiSeeds: demoTeam.kpiSeeds, // Re-use seeds if wrapper generates graphs from seeds
                drivers: demoTeam.drivers,
                actions: demoTeam.actions,
                briefing: demoTeam.briefing,
                governance: demoTeam.governance,
                // Add missing fields required by TeamDashboardData
                attribution: {
                    primarySource: 'INTERNAL' as const,
                    internalDrivers: [],
                    externalDependencies: [],
                    propagationRisk: null
                },
                quality: {
                    reliability: 0.9,
                    completeness: 0.95,
                    freshness: 0
                },
                trend: {
                    regime: 'STABLE',
                    volatility: 0.1,
                    direction: 'STABLE' as const
                },
                latestIndices: {
                    strain: { value: 0.45, qualitative: 'Moderate' },
                    withdrawalRisk: { value: 0.30, qualitative: 'Low' },
                    trustGap: { value: 0.25, qualitative: 'Low' },
                    engagement: { value: 0.70, qualitative: 'High' }
                }
            };

            // @ts-ignore - Approximate match for demo
            return <TeamClientWrapper initialData={syntheticData} interpretation={null} />;
        }

        redirect('/auth/sign-in');
    }

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

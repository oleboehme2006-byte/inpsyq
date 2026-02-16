import { TeamClientWrapper } from '@/components/dashboard/team/TeamClientWrapper';
import { getTeamDashboardData, TeamDashboardData } from '@/services/dashboard/teamReader';
import { getOrCreateTeamInterpretation } from '@/services/interpretation/service';
import { resolveAuthContext } from '@/lib/auth/context';
import { notFound, redirect } from 'next/navigation';
import { teamDashboardData as mockTeams } from '@/lib/mock/teamDashboardData';

interface TeamPageProps {
    params: Promise<{ teamId: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
    const { teamId } = await params;
    const auth = await resolveAuthContext();

    // 1. Authenticated Access: Fetch real data
    if (auth.authenticated && auth.context?.orgId) {
        const [dashboardData, interpretation] = await Promise.all([
            getTeamDashboardData(auth.context.orgId, teamId),
            getOrCreateTeamInterpretation(auth.context.orgId, teamId)
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

    // 2. Unauthenticated Access: Check for Demo Team
    // This allows public access to /team/product etc. as a demo
    const teamIdKey = teamId.toLowerCase();
    const mockTeam = mockTeams[teamIdKey];

    if (mockTeam) {
        // Transform Mock Data to Dashboard Structure
        // Assuming mock seed values like 45 mean 0.45
        const seedToValue = (v: number) => v / 100;

        const demoData: TeamDashboardData = {
            meta: {
                teamId: mockTeam.id,
                teamName: mockTeam.name,
                latestWeek: new Date().toISOString(),
                computeVersion: 'demo',
                weeksAvailable: 12,
            },
            // Generate deterministic mock series (12 weeks)
            series: Array.from({ length: 12 }, (_, i) => {
                const noise = Math.sin(i) * 0.05;
                return {
                    date: `W${i + 1}`,
                    fullDate: new Date(Date.now() - (11 - i) * 604800000).toISOString(),
                    strain: Math.min(1, Math.max(0, seedToValue(mockTeam.kpiSeeds.strainBase) + noise)),
                    withdrawal: Math.min(1, Math.max(0, seedToValue(mockTeam.kpiSeeds.withdrawalBase) + noise)),
                    trust: Math.min(1, Math.max(0, seedToValue(mockTeam.kpiSeeds.trustBase) + noise)),
                    engagement: Math.min(1, Math.max(0, seedToValue(mockTeam.kpiSeeds.engagementBase) - noise)),
                    confidence: 0.9 + (Math.random() * 0.1)
                };
            }),
            kpiSeeds: {
                strain: seedToValue(mockTeam.kpiSeeds.strainBase),
                withdrawal: seedToValue(mockTeam.kpiSeeds.withdrawalBase),
                trust: seedToValue(mockTeam.kpiSeeds.trustBase),
                engagement: seedToValue(mockTeam.kpiSeeds.engagementBase)
            },
            drivers: mockTeam.drivers,
            actions: mockTeam.actions,
            briefing: mockTeam.briefing,
            governance: {
                ...mockTeam.governance,
                signalConfidence: mockTeam.governance.signalConfidence / 100 // Scale to 0-1
            },
            latestIndices: {
                strain: { value: seedToValue(mockTeam.kpiSeeds.strainBase), qualitative: 'Moderate' },
                withdrawalRisk: { value: seedToValue(mockTeam.kpiSeeds.withdrawalBase), qualitative: 'Low' },
                trustGap: { value: seedToValue(mockTeam.kpiSeeds.trustBase), qualitative: 'High' },
                engagement: { value: seedToValue(mockTeam.kpiSeeds.engagementBase), qualitative: 'High' }
            },
            attribution: {
                primarySource: 'INTERNAL',
                internalDrivers: [],
                externalDependencies: [],
                propagationRisk: null
            },
            quality: {
                coverage: mockTeam.governance.coverage / 100,
                confidence: mockTeam.governance.signalConfidence / 100,
                missingWeeks: 0
            },
            trend: {
                regime: 'STABLE',
                volatility: 0.1,
                direction: 'STABLE'
            }
        };

        return <TeamClientWrapper initialData={demoData} interpretation={null} />;
    }

    // 3. Fallback: Redirect to Login
    redirect('/auth/sign-in'); // Or resolveAuthContext().redirectTo
}

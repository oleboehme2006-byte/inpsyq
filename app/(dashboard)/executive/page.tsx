import React from 'react';
import { ExecutiveClientWrapper } from '@/components/dashboard/executive/ExecutiveClientWrapper';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default async function ExecutiveDashboard() {
    // Check auth state
    const { resolveAuthContext } = await import('@/lib/auth/context');
    const auth = await resolveAuthContext();

    // IF DEMO_MODE or Unauthenticated -> Show Demo Data
    if (DEMO_MODE || !auth.authenticated) {
        const { executiveMockData } = await import('@/lib/mock/executiveData');

        // Transform executiveMockData to the structure expected by ExecutiveClientWrapper
        const demoData = {
            meta: {
                orgId: 'demo',
                latestWeek: 'Feb 16, 2026',
                teamsCount: executiveMockData.teams.length,
                weeksAvailable: 12,
                cacheHit: true
            },
            orgIndices: {
                strain: { value: executiveMockData.kpis[0].score / 100, qualitative: 'Critical' },
                withdrawalRisk: { value: executiveMockData.kpis[1].score / 100, qualitative: 'At Risk' },
                trustGap: { value: executiveMockData.kpis[2].score / 100, qualitative: 'Moderate' },
                engagement: { value: executiveMockData.kpis[3].score / 100, qualitative: 'Moderate' },
            },
            orgTrend: {
                direction: 'UP' as const,
                volatility: 0.12
            },
            riskDistribution: {
                critical: executiveMockData.teams.filter(t => t.status === 'Critical').length,
                atRisk: executiveMockData.teams.filter(t => t.status === 'At Risk').length,
                healthy: executiveMockData.teams.filter(t => t.status === 'Healthy').length
            },
            teams: executiveMockData.teams.map(t => ({
                teamId: t.name.toLowerCase(),
                teamName: t.name,
                stateLabel: t.status.toUpperCase() as any,
                strainValue: t.strain / 100,
                strainQualitative: t.status,
                trendDirection: 'STABLE' as const,
                weeksAvailable: 12
            })),
            systemicDrivers: executiveMockData.drivers.map(d => ({
                driverFamily: d.scope.toUpperCase(),
                label: d.label,
                affectedTeams: 3,
                aggregateImpact: d.score / 100
            })),
            watchlist: executiveMockData.watchlist.map(w => ({
                teamId: w.team.toLowerCase(),
                teamName: w.team,
                reason: w.message,
                severity: w.severity === 'critical' ? 0.9 : 0.6
            })),
            history: Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (11 - i) * 7);
                return {
                    weekStart: date.toISOString(),
                    strain: 0.4 + Math.sin(i) * 0.1,
                    withdrawalRisk: 0.3 + Math.cos(i) * 0.1,
                    trustGap: 0.35 + Math.sin(i / 2) * 0.05,
                    engagement: 0.6 + Math.cos(i / 2) * 0.05
                };
            }),
        };

        const demoInterpretation = {
            sectionsJson: {
                executiveSummary: "Organizational health shows critical strain in core delivery units. While engagement remains resilient in Support and HR, Product and Engineering are exhibiting early signs of structural withdrawal driven by prolonged workload pressure.",
                whatChanged: [
                    "Strain Index increased by 12% in Product following the Q4 roadmap acceleration.",
                    "Trust Gap stabilized at 28% after the recent leadership alignment session.",
                    "Engagement in Operations peaked at 85% following process improvements."
                ],
                primaryDrivers: {
                    internal: [
                        { label: "Workload Debt", severityLevel: "C3", directionalityHint: "WORSENING", evidenceTag: "Metadata Analysis" },
                        { label: "Process Friction", severityLevel: "C2", directionalityHint: "STABLE", evidenceTag: "Sentiment Pulse" }
                    ],
                    external: [
                        { label: "Market Volatility", impactLevel: "D1", controllability: "NONE", evidenceTag: "Macro Indicator" }
                    ]
                },
                riskOutlook: [
                    "High probability of attrition in Product if workload is not adjusted within 4 weeks.",
                    "Potential for quality regressions in Engineering due to cognitive overload."
                ],
                recommendedFocus: [
                    "Implement mandatory recovery periods for Product teams.",
                    "Audit deployment friction to recover Engineering capacity."
                ],
                confidenceAndLimits: "Analysis based on 92% coverage across 6 teams. High confidence in strain patterns, moderate confidence in causal attribution for Support engagement."
            }
        };

        return <ExecutiveClientWrapper initialData={demoData as any} interpretation={demoInterpretation as any} />;
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

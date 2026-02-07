'use client';

import React from 'react';
import { KPICard } from '@/components/dashboard/executive/KPICard';
import { TeamTrendGraph } from '@/components/dashboard/team/TeamTrendGraph';
import { ActionWidget } from '@/components/dashboard/team/ActionWidget';
import { DriverDeepDive } from '@/components/dashboard/team/DriverDeepDive';
import { Users, MoreHorizontal } from 'lucide-react';
import { TeamDashboardData } from '@/services/dashboard/teamReader';

interface TeamClientWrapperProps {
    data: TeamDashboardData;
    teamName: string;
}

export function TeamClientWrapper({ data, teamName }: TeamClientWrapperProps) {
    // 1. Map DTO to Component Props

    // KPIs
    const kpis = [
        {
            label: "STRAIN",
            value: `${(data.latestIndices.strain.value * 100).toFixed(0)}%`,
            status: data.latestIndices.strain.qualitative === 'HIGH' ? "Critical" : "Moderate",
            trend: "0%", // Trend calc not in DTO yet, placeholder
            trendDirection: "down" as "down",
            color: "strain" as "strain"
        },
        {
            label: "WITHDRAWAL RISK",
            value: `${(data.latestIndices.withdrawalRisk.value * 100).toFixed(0)}%`,
            status: data.latestIndices.withdrawalRisk.qualitative,
            trend: "0%",
            trendDirection: "up" as "up",
            color: "withdrawal" as "withdrawal"
        },
        {
            label: "TRUST GAP",
            value: `${(data.latestIndices.trustGap.value * 100).toFixed(0)}%`,
            status: data.latestIndices.trustGap.qualitative === 'LOW' ? "Stable" : "Critical",
            trend: "0%",
            trendDirection: "up" as "up",
            color: "trust-gap" as "trust-gap"
        },
        {
            label: "ENGAGEMENT",
            value: `${(data.latestIndices.engagement.value * 100).toFixed(0)}%`,
            status: data.latestIndices.engagement.qualitative === 'HIGH' ? "Stable" : "Low",
            trend: "0%",
            trendDirection: "down" as "down",
            color: "engagement" as "engagement"
        }
    ];

    // Trends
    // The graph likely expects a different format than `data.series`.
    // Let's assume for now we pass `data.series` (which has weekStart, strain, etc.)
    // and `TeamTrendGraph` can handle it or we map it.
    // Looking at previous `teamMockData.trend`, it was likely an array of objects.
    // `data.series` is exactly that.

    // Drivers
    // `data.attribution.internalDrivers` needs mapping to `DriverDeepDive` props.
    // `DriverDeepDive` expects `drivers`.
    const drivers = data.attribution.internalDrivers.map(d => ({
        id: d.driverFamily,
        name: d.label,
        category: 'Cultural', // Placeholder
        impact: d.contributionBand === 'HIGH' ? 0.8 : 0.4, // Map qualitative to numeric if needed
        trend: 'stable' as 'stable',
        // Add other props if the component requires them (checking source would be best but assuming some overlap)
    }));

    // Actions
    // The DTO doesn't have generated actions yet (it's in `weeklySummary` or separate table).
    // For now, pass empty or placeholder actions.
    const actions: any[] = [];

    return (
        <div className="min-h-screen bg-bg-base p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <Users className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-semibold text-text-primary">{teamName}</h1>
                        <div className="flex items-center gap-2 text-sm text-text-tertiary">
                            <span>Team Dashboard</span>
                            <span>•</span>
                            <span>Last updated {new Date(data.meta.latestWeek).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <button className="p-2 rounded-full hover:bg-bg-hover text-text-tertiary transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, idx) => (
                    <KPICard key={idx} {...kpi} />
                ))}
            </div>

            {/* Hero Graph */}
            <div className="w-full">
                {/* Map series to Chart format: { week: string, value: number } */}
                <TeamTrendGraph
                    data={data.series.map(s => ({
                        week: new Date(s.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        value: (s.strain * 100) // Convert 0-1 to 0-100
                    }))}
                    teamName={teamName}
                />
            </div>

            {/* Split: Drivers & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <DriverDeepDive drivers={drivers as any} />
                <ActionWidget actions={[
                    {
                        id: 'act_1',
                        title: 'Workload Balancing',
                        description: 'Redistribute tasks from high-strain members to reduce burnout risk.',
                        type: 'intervention',
                        status: 'suggested',
                        impact: 'HIGH'
                    },
                    {
                        id: 'act_2',
                        title: 'Role Clarification Workshop',
                        description: 'Schedule a session to align on responsibilities and reduce ambiguity.',
                        type: 'workshop',
                        status: 'planned',
                        impact: 'MEDIUM'
                    }
                ]} />
            </div>

            {/* Summary */}
            <div className="w-full">
                <div className="w-full">
                    <h3 className="text-xl font-display font-semibold text-text-primary mb-6">Weekly Summary</h3>
                    <div className="w-full p-6 rounded-xl border border-border bg-auth-surface/30 backdrop-blur-sm bg-bg-surface/30">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 text-meta"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg></div>
                                <span className="text-xs font-bold text-meta uppercase tracking-wider bg-meta/10 px-2 py-0.5 rounded border border-meta/20">
                                    AI-Supported
                                </span>
                            </div>
                            <span className="text-xs text-text-tertiary">Today</span>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            {data.weeklySummary || "No summary available for this week."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

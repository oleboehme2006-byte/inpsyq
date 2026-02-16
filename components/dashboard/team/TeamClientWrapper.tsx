'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { KPICard } from '@/components/dashboard/executive/KPICard';
import { EngagementIndexGraph } from '@/components/dashboard/executive/EngagementIndexGraph';
import { DriversActionsSection } from '@/components/dashboard/team/DriversActionsSection';
import { TeamBriefing } from '@/components/dashboard/team/TeamBriefing';
import { DataGovernance } from '@/components/dashboard/executive/DataGovernance';
import { Globe, ArrowLeft, Users } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { WeeklyInterpretationRecord } from '@/lib/interpretation/types';
import { TeamDashboardData } from '@/services/dashboard/teamReader';

interface TeamClientWrapperProps {
    initialData: TeamDashboardData;
    interpretation: WeeklyInterpretationRecord | null;
}

export function TeamClientWrapper({ initialData, interpretation }: TeamClientWrapperProps) {
    const [selectedKpi, setSelectedKpi] = useState('engagement');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const teamData = initialData;
    const meta = teamData.meta;
    const history = teamData.series;

    // Graph Data from History
    const graphData = useMemo(() => {
        return history.map(h => ({
            date: h.date,
            fullDate: h.fullDate,
            strain: h.strain,
            withdrawal: h.withdrawal,
            trust: h.trust,
            engagement: h.engagement,
            confidence: h.confidence,
            strainRange: [h.strain - h.confidence, h.strain + h.confidence],
            withdrawalRange: [h.withdrawal - h.confidence, h.withdrawal + h.confidence],
            trustRange: [h.trust - h.confidence, h.trust + h.confidence],
            engagementRange: [h.engagement - h.confidence, h.engagement + h.confidence],
        }));
    }, [history]);

    // Extract Latest Values for KPIs
    const latest = graphData[graphData.length - 1];
    const previous = graphData[graphData.length - 2];

    const getTrend = (curr: number, prev: number) => {
        const diff = curr - prev;
        return `${diff > 0 ? '+' : ''}${diff.toFixed(0)}%`;
    };

    const kpis = [
        {
            id: 'strain',
            title: 'Strain',
            value: latest.strain.toFixed(0),
            color: 'strain',
            trendValue: getTrend(latest.strain, previous.strain)
        },
        {
            id: 'withdrawal',
            title: 'Withdrawal Risk',
            value: latest.withdrawal.toFixed(0),
            color: 'withdrawal',
            trendValue: getTrend(latest.withdrawal, previous.withdrawal)
        },
        {
            id: 'trust',
            title: 'Trust Gap',
            value: latest.trust.toFixed(0),
            color: 'trust-gap',
            trendValue: getTrend(latest.trust, previous.trust)
        },
        {
            id: 'engagement',
            title: 'Engagement',
            value: latest.engagement.toFixed(0),
            color: 'engagement',
            trendValue: getTrend(latest.engagement, previous.engagement)
        },
    ];

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-500">
            {/* Header: Acme Corporation · Team Name · inPsyq */}
            <div className="flex items-center justify-between">
                {/* Left: Org + Team */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/executive"
                        className="flex items-center gap-2 text-text-tertiary hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <Globe className="w-8 h-8 text-[#8B5CF6]" strokeWidth={1.5} />
                    <h1 className="text-4xl font-display font-medium text-white tracking-tight">
                        Acme Corporation
                    </h1>
                    <div className="h-8 w-px bg-white/15 mx-2" />
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-[#8B5CF6]" strokeWidth={1.5} />
                        <span className="text-2xl font-display font-medium text-[#8B5CF6] tracking-tight">
                            {meta.teamName}
                        </span>
                    </div>
                </div>

                {/* Right: Brand Logo */}
                <div>
                    <div className="relative">
                        <span className="text-3xl font-display font-semibold text-white tracking-tight">inPsyq</span>
                        <div className="absolute -bottom-1 left-0 w-full h-1 bg-[#8B5CF6] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                    </div>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-4 gap-6">
                {kpis.map((kpi: any) => (
                    <KPICard
                        key={kpi.id}
                        id={kpi.id}
                        label={kpi.title}
                        value={kpi.value}
                        trendValue={kpi.trendValue}
                        color={kpi.color}
                        isActive={selectedKpi === kpi.id}
                        onClick={() => setSelectedKpi(kpi.id)}
                    />
                ))}
            </div>

            {/* Main Chart Section */}
            <div className="w-full">
                <EngagementIndexGraph
                    metric={selectedKpi as any}
                    data={graphData}
                />
            </div>

            {/* Split Section: Internal Drivers & Actions */}
            <DriversActionsSection
                drivers={teamData.drivers}
                actions={teamData.actions}
            />

            {/* Team Briefing & Governance */}
            <div className="space-y-8 pb-12">
                <TeamBriefing
                    teamName={meta.teamName}
                    paragraphs={teamData.briefing}
                />
                <DataGovernance
                    coverage={teamData.governance.coverage}
                    dataQuality={teamData.governance.dataQuality}
                    temporalStability={teamData.governance.temporalStability}
                    signalConfidence={teamData.governance.signalConfidence}
                    totalSessions={teamData.governance.totalSessions}
                    lastUpdated={teamData.governance.lastUpdated}
                />
            </div>
        </div>
    );
}

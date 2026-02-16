'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { KPICard } from '@/components/dashboard/executive/KPICard';
import { EngagementIndexGraph } from '@/components/dashboard/executive/EngagementIndexGraph';
import { TeamPortfolioTable } from '@/components/dashboard/executive/TeamPortfolioTable';
import { DriversWatchlistSection } from '@/components/dashboard/executive/DriversWatchlistSection';
import { Briefing } from '@/components/dashboard/executive/Briefing';
import { DataGovernance } from '@/components/dashboard/executive/DataGovernance';
import { ExecutiveDashboardData } from '@/services/dashboard/executiveReader';
import { Globe } from 'lucide-react';
import { format, subWeeks } from 'date-fns';

import { WeeklyInterpretationRecord } from '@/lib/interpretation/types';

interface ExecutiveClientWrapperProps {
    initialData: ExecutiveDashboardData;
    interpretation?: WeeklyInterpretationRecord | null;
}

export function ExecutiveClientWrapper({ initialData, interpretation }: ExecutiveClientWrapperProps) {
    const [selectedKpi, setSelectedKpi] = useState('engagement');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Transform History for Graph
    const graphData = useMemo(() => {
        if (!initialData.history || initialData.history.length === 0) {
            return [];
        }

        // Sort history by weekStart
        const sorted = [...initialData.history].sort((a, b) =>
            new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
        );

        return sorted.map(d => {
            const date = new Date(d.weekStart);
            const baseConfidence = 5; // Fixed confidence or derived?
            // ExecutiveDashboardData doesn't have confidence per week in history yet.
            // Using placeholder confidence for visual continuity.

            return {
                date: format(date, 'MMM d'),
                fullDate: d.weekStart,
                strain: d.strain * 100, // Indices are 0-1, graph expects 0-100?
                withdrawal: d.withdrawalRisk * 100,
                trust: d.trustGap * 100,
                engagement: d.engagement * 100,
                confidence: baseConfidence,
                strainRange: [d.strain * 100 - baseConfidence, d.strain * 100 + baseConfidence],
                withdrawalRange: [d.withdrawalRisk * 100 - baseConfidence, d.withdrawalRisk * 100 + baseConfidence],
                trustRange: [d.trustGap * 100 - baseConfidence, d.trustGap * 100 + baseConfidence],
                engagementRange: [d.engagement * 100 - baseConfidence, d.engagement * 100 + baseConfidence],
            };
        });
    }, [initialData.history]);

    // Extract Latest Values for KPIs
    // Use graphData if available, otherwise fallback (shouldn't happen with real data)
    let latest: any, previous: any;

    if (graphData.length > 0) {
        latest = graphData[graphData.length - 1];
        previous = graphData.length > 1 ? graphData[graphData.length - 2] : latest;
    } else {
        // Fallback or Empty State
        latest = { strain: 0, withdrawal: 0, trust: 0, engagement: 0 };
        previous = { strain: 0, withdrawal: 0, trust: 0, engagement: 0 };
    }

    const getTrend = (curr: number, prev: number) => {
        const diff = curr - prev;
        return `${diff > 0 ? '+' : ''}${diff.toFixed(0)}%`;
    };

    const kpis = [
        {
            id: 'strain',
            title: 'Strain',
            value: (initialData.orgIndices.strain.value * 100).toFixed(0), // Use direct data
            color: 'strain',
            trendValue: getTrend(initialData.orgIndices.strain.value * 100, (previous.strain || 0))
        },
        {
            id: 'withdrawal',
            title: 'Withdrawal Risk',
            value: (initialData.orgIndices.withdrawalRisk.value * 100).toFixed(0),
            color: 'withdrawal',
            trendValue: getTrend(initialData.orgIndices.withdrawalRisk.value * 100, (previous.withdrawal || 0))
        },
        {
            id: 'trust',
            title: 'Trust Gap',
            value: (initialData.orgIndices.trustGap.value * 100).toFixed(0),
            color: 'trust-gap',
            trendValue: getTrend(initialData.orgIndices.trustGap.value * 100, (previous.trust || 0))
        },
        {
            id: 'engagement',
            title: 'Engagement',
            value: (initialData.orgIndices.engagement.value * 100).toFixed(0),
            color: 'engagement',
            trendValue: getTrend(initialData.orgIndices.engagement.value * 100, (previous.engagement || 0))
        },
    ];

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-500">
            {/* Header Redesign */}
            <div className="flex items-center justify-between">
                {/* Left: Icon + Title */}
                <div className="flex items-center gap-4">
                    <Globe className="w-8 h-8 text-[#8B5CF6]" strokeWidth={1.5} />
                    <h1 className="text-4xl font-display font-medium text-white tracking-tight">Acme Corporation</h1>
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

            {/* Team Portfolio */}
            <div className="w-full">
                <TeamPortfolioTable />
            </div>

            {/* Briefing Card (Full Width) */}
            <div className="col-span-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <Briefing interpretation={interpretation} />
            </div>

            {/* Systemic Drivers & Watchlist (Full Width -> Split inside) */}
            <div className="col-span-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <DriversWatchlistSection
                    systemicDrivers={initialData.systemicDrivers}
                    watchlist={initialData.watchlist}
                />
            </div>

            {/* Data Governance */}
            <div className="space-y-8 pb-12">
                <DataGovernance />
            </div>
        </div>
    );
}

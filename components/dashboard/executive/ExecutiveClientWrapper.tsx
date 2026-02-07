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

interface ExecutiveClientWrapperProps {
    initialData: ExecutiveDashboardData;
}

export function ExecutiveClientWrapper({ initialData }: ExecutiveClientWrapperProps) {
    const [selectedKpi, setSelectedKpi] = useState('engagement');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Centralized Data Generation for Synchronization
    // Using simple math to be deterministic without complex seeds
    const graphData = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 12 }).map((_, i) => {
            const date = subWeeks(now, 11 - i);
            const baseConfidence = 3 + (Math.sin(i * 0.5) * 2);

            const strain = 20 + (i * 1.5) + (Math.sin(i) * 5);
            const withdrawal = 15 + (i * 2.5) + (Math.cos(i) * 3);
            const trust = 20 + (i * 3) + (Math.sin(i * 0.5) * 2);
            const engagement = 70 - (i * 1) + (Math.sin(i * 2) * 4);

            return {
                date: format(date, 'MMM d'),
                fullDate: date.toISOString(),
                strain: Math.max(0, Math.min(100, strain)),
                withdrawal: Math.max(0, Math.min(100, withdrawal)),
                trust: Math.max(0, Math.min(100, trust)), // mapped to 'trust-gap'
                engagement: Math.max(0, Math.min(100, engagement)),
                confidence: Math.abs(baseConfidence)
            };
        }).map(d => ({
            ...d,
            strainRange: [d.strain - d.confidence, d.strain + d.confidence],
            withdrawalRange: [d.withdrawal - d.confidence, d.withdrawal + d.confidence],
            trustRange: [d.trust - d.confidence, d.trust + d.confidence],
            engagementRange: [d.engagement - d.confidence, d.engagement + d.confidence],
        }));
    }, []);

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

            {/* Split Section: Drivers & Watchlist with Interaction */}
            <DriversWatchlistSection />

            {/* Briefing & Governance */}
            <div className="space-y-8 pb-12">
                <Briefing />
                <DataGovernance />
            </div>
        </div>
    );
}

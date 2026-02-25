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
import { cn } from '@/lib/utils';

interface ExecutiveClientWrapperProps {
    initialData: ExecutiveDashboardData;
}

export function ExecutiveClientWrapper({ initialData }: ExecutiveClientWrapperProps) {
    const [selectedKpi, setSelectedKpi] = useState('engagement');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // -------------------------------------------------------------------------
    // Graph Data — use real series from DB; fall back to synthetic for demo mode
    // -------------------------------------------------------------------------
    const graphData = useMemo(() => {
        if (initialData.series && initialData.series.length > 0) {
            return initialData.series;
        }
        // Demo / empty fallback: deterministic synthetic series
        const now = new Date();
        return Array.from({ length: 12 }).map((_, i) => {
            const date = subWeeks(now, 11 - i);
            const baseConfidence = 3 + (Math.sin(i * 0.5) * 2);
            const strain = 20 + (i * 1.5) + (Math.sin(i) * 5);
            const withdrawal = 15 + (i * 2.5) + (Math.cos(i) * 3);
            const trust = 20 + (i * 3) + (Math.sin(i * 0.5) * 2);
            const engagement = 70 - (i * 1) + (Math.sin(i * 2) * 4);
            const s = Math.max(0, Math.min(100, strain));
            const w = Math.max(0, Math.min(100, withdrawal));
            const t = Math.max(0, Math.min(100, trust));
            const e = Math.max(0, Math.min(100, engagement));
            const c = Math.abs(baseConfidence);
            return {
                date: format(date, 'MMM d'),
                fullDate: date.toISOString(),
                strain: s,
                withdrawal: w,
                trust: t,
                engagement: e,
                confidence: c,
                strainRange: [s - c, s + c] as [number, number],
                withdrawalRange: [w - c, w + c] as [number, number],
                trustRange: [t - c, t + c] as [number, number],
                engagementRange: [e - c, e + c] as [number, number],
            };
        });
    }, [initialData.series]);

    // -------------------------------------------------------------------------
    // KPI Cards — use real KPIs from server; fall back to derived from graphData
    // -------------------------------------------------------------------------
    const kpis = useMemo(() => {
        if (initialData.kpis && initialData.kpis.length > 0) {
            return initialData.kpis.map(k => ({
                id: k.id,
                title: k.title,
                value: k.value,
                color: k.semanticColor as 'strain' | 'withdrawal' | 'trust-gap' | 'engagement',
                trendValue: k.trendValue,
            }));
        }
        // Demo fallback: derive from the last two graph points
        const latest = graphData[graphData.length - 1];
        const previous = graphData[graphData.length - 2];
        const getTrend = (curr: number, prev: number) =>
            `${curr - prev >= 0 ? '+' : ''}${(curr - prev).toFixed(0)}%`;
        return [
            { id: 'strain', title: 'Strain', value: latest.strain.toFixed(0), color: 'strain' as const, trendValue: getTrend(latest.strain, previous.strain) },
            { id: 'withdrawal', title: 'Withdrawal Risk', value: latest.withdrawal.toFixed(0), color: 'withdrawal' as const, trendValue: getTrend(latest.withdrawal, previous.withdrawal) },
            { id: 'trust', title: 'Trust Gap', value: latest.trust.toFixed(0), color: 'trust-gap' as const, trendValue: getTrend(latest.trust, previous.trust) },
            { id: 'engagement', title: 'Engagement', value: latest.engagement.toFixed(0), color: 'engagement' as const, trendValue: getTrend(latest.engagement, previous.engagement) },
        ];
    }, [initialData.kpis, graphData]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-500">
            {/* Header Redesign */}
            <div data-tutorial="executive-header" className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left: Icon + Title + Badge */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <Globe className="w-8 h-8 text-[#8B5CF6]" strokeWidth={1.5} />
                        <h1 className="text-4xl font-display font-medium text-white tracking-tight">{initialData.orgName || 'Acme Corporation'}</h1>
                    </div>

                    {/* Data Status Badge */}
                    <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-2 border",
                        initialData.series && initialData.series.length > 0
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full animate-pulse",
                            initialData.series && initialData.series.length > 0 ? "bg-emerald-400" : "bg-amber-400"
                        )} />
                        {initialData.series && initialData.series.length > 0 ? "LIVE DATA" : "DEMO MODE"}
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
            <div data-tutorial="executive-kpis" className="grid grid-cols-4 gap-6">
                {kpis.map((kpi) => (
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
            <div data-tutorial="executive-chart" className="w-full">
                <EngagementIndexGraph
                    metric={selectedKpi as any}
                    data={graphData}
                />
            </div>

            {/* Team Portfolio — receives real teams from server */}
            <div className="w-full">
                <TeamPortfolioTable teams={initialData.teams} />
            </div>

            {/* Split Section: Drivers & Watchlist with Interaction */}
            <DriversWatchlistSection
                drivers={initialData.drivers}
                watchlist={initialData.watchlist}
            />

            {/* Briefing & Governance */}
            <div data-tutorial="executive-briefing" className="space-y-8 pb-12">
                <Briefing paragraphs={initialData.briefingParagraphs} />
                <DataGovernance
                    coverage={initialData.governance.coverage}
                    dataQuality={initialData.governance.dataQuality}
                    totalSessions={initialData.governance.totalSessions}
                    lastUpdated={initialData.governance.lastUpdated}
                />
            </div>
        </div>
    );
}

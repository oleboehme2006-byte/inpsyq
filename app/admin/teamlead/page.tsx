'use client';

import React, { useState } from 'react';
import DemoConfig, { DemoSettings } from '@/components/admin/DemoConfig';
import StateCard from '@/components/admin/teamlead/StateCard';
import TrendSection from '@/components/admin/teamlead/TrendSection';
import DriverInfluenceTable from '@/components/admin/teamlead/DriverInfluenceTable';
import ActionCard from '@/components/admin/teamlead/ActionCard';
import BriefPanel from '@/components/admin/teamlead/BriefPanel';
import { DecisionSnapshot } from '@/services/decision/types';

export default function TeamleadDashboardPage() {
    const [settings, setSettings] = useState<DemoSettings | null>(null);
    const [snapshot, setSnapshot] = useState<DecisionSnapshot | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPayloads, setShowPayloads] = useState(false);

    const loadData = async (cfg: DemoSettings) => {
        setLoading(true);
        setError(null);
        setSettings(cfg);
        try {
            // 1. Fetch Decision Snapshot (The core logic)
            const snapRes = await fetch(`/api/admin/decision?org_id=${cfg.orgId}&team_id=${cfg.teamId}&week_start=${cfg.weekStart}`);
            if (!snapRes.ok) throw new Error(await snapRes.text());
            const snapData = await snapRes.json();
            setSnapshot(snapData);

            // 2. Fetch Weekly History (For the chart context)
            const histRes = await fetch(`/api/admin/weekly?org_id=${cfg.orgId}&team_id=${cfg.teamId}`);
            if (histRes.ok) {
                const histData = await histRes.json();
                if (Array.isArray(histData)) {
                    // Filter history up to current week for context
                    setHistory(histData.sort((a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime()));
                }
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load dashboard.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-900 selection:text-white pb-20">
            {/* Header */}
            <div className="border-b border-slate-800 bg-black/40 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white">TL</div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-100 leading-tight">Teamlead Dashboard</h1>
                            <p className="text-xs text-slate-500">Decision Support Layer</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Configuration Panel */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <DemoConfig onConfigApply={loadData} />
                </div>

                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-900/50 rounded-xl border border-slate-800"></div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="p-6 bg-red-900/20 border border-red-800/50 text-red-200 rounded-xl text-center">
                        <h3 className="font-bold text-lg mb-2">Analysis Failed</h3>
                        <p>{error}</p>
                    </div>
                )}



                {!loading && !error && snapshot && (
                    <div className="space-y-6">
                        {/* Executive Narrative */}
                        {settings && (
                            <BriefPanel
                                orgId={settings.orgId}
                                teamId={settings.teamId}
                                weekStart={settings.weekStart}
                            />
                        )}

                        {/* Row 1: State & Trend */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[400px]">
                            {/* 1. Criticality State (4 cols) */}
                            <div className="lg:col-span-4 h-full">
                                <StateCard state={snapshot.state} />
                            </div>

                            {/* 2. Stability Chart (8 cols) */}
                            <div className="lg:col-span-8 h-full">
                                <TrendSection trend={snapshot.trend} history={history} />
                            </div>
                        </div>

                        {/* Row 2: Drivers, Influence, Action */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* 3 & 4. Drivers & Influence (5 cols) */}
                            <div className="lg:col-span-5 h-[600px]">
                                <DriverInfluenceTable drivers={snapshot.drivers} />
                            </div>

                            {/* 5. Action Recommendation (7 cols) */}
                            <div className="lg:col-span-7 h-full">
                                <ActionCard action={snapshot.recommendation.primary} />
                            </div>
                        </div>

                        {/* Inspect Payloads Toggle */}
                        <div className="flex justify-end pt-8">
                            <button
                                onClick={() => setShowPayloads(!showPayloads)}
                                className="text-xs text-slate-500 hover:text-slate-300 transition-colors uppercase font-mono"
                            >
                                {showPayloads ? 'Hide Raw Payloads' : 'Inspect Payloads'}
                            </button>
                        </div>

                        {showPayloads && (
                            <div className="border border-slate-700 rounded-xl overflow-hidden mt-4">
                                <div className="bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    Decision Snapshot Payload
                                </div>
                                <div className="bg-black/60 p-4 font-mono text-[10px] text-slate-400 h-96 overflow-auto">
                                    <pre>{JSON.stringify(snapshot, null, 2)}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!loading && !snapshot && !error && (
                    <div className="text-center py-20 text-slate-500 italic">
                        Select an Organization, Team, and Week to begin diagnostics.
                    </div>
                )}
            </div>
        </main>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import { TeamDashboardDTO } from '@/lib/dashboard/types';
import DecisionBlock, { EmptyState } from '@/components/admin/dashboard/DecisionBlock';
import StateBlock from '@/components/admin/dashboard/StateBlock';
import TrendBlock from '@/components/admin/dashboard/TrendBlock';
import DriversBlock from '@/components/admin/dashboard/DriversBlock';
import InfluenceBlock from '@/components/admin/dashboard/InfluenceBlock';
import ActionBlock from '@/components/admin/dashboard/ActionBlock';
import DemoConfig, { DemoSettings } from '@/components/admin/DemoConfig';

export default function TeamleadDashboardPage() {
    const [settings, setSettings] = useState<DemoSettings | null>(null);
    const [dto, setDto] = useState<TeamDashboardDTO | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDto, setShowDto] = useState(false);

    const loadData = async (cfg: DemoSettings) => {
        setLoading(true);
        setError(null);
        setSettings(cfg);

        try {
            // Fetch TeamDashboardDTO
            const dtoRes = await fetch(
                `/api/admin/team-dashboard?org_id=${cfg.orgId}&team_id=${cfg.teamId}&week_start=${cfg.weekStart}`
            );
            if (!dtoRes.ok) {
                const errText = await dtoRes.text();
                throw new Error(errText || `HTTP ${dtoRes.status}`);
            }
            const dtoData: TeamDashboardDTO = await dtoRes.json();
            setDto(dtoData);

            // Fetch history for trend chart
            const histRes = await fetch(`/api/admin/weekly?org_id=${cfg.orgId}&team_id=${cfg.teamId}`);
            if (histRes.ok) {
                const histData = await histRes.json();
                if (Array.isArray(histData)) {
                    setHistory(histData.sort((a, b) =>
                        new Date(a.week_start).getTime() - new Date(b.week_start).getTime()
                    ));
                }
            }
        } catch (err: any) {
            console.error('[TeamleadDashboard]', err);
            setError(err.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const isDev = process.env.NODE_ENV !== 'production';

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-900 selection:text-white">
            {/* Header */}
            <div className="border-b border-slate-800 bg-black/40 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white">
                            TL
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-100 leading-tight">Teamlead Dashboard</h1>
                            <p className="text-xs text-slate-500">Decision Support Layer</p>
                        </div>
                    </div>
                    {dto && (
                        <div className="text-xs text-slate-500">
                            <span className="mr-3">Request: {dto.meta.request_id.slice(0, 8)}...</span>
                            <span>{dto.meta.duration_ms}ms</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                {/* Config Panel */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <DemoConfig onConfigApply={loadData} />
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <DecisionBlock key={i} question="Loading..." loading className="h-64" />
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="p-6 bg-red-900/20 border border-red-800/50 text-red-200 rounded-xl">
                        <h3 className="font-bold text-lg mb-2">Dashboard Error</h3>
                        <p>{error}</p>
                    </div>
                )}

                {/* Governance Block */}
                {dto && dto.state.governance_status === 'blocked' && (
                    <div className="p-4 bg-red-900/30 border-l-4 border-red-600 rounded-r-xl">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🛑</span>
                            <div>
                                <h3 className="font-bold text-red-200">Analysis Blocked</h3>
                                <p className="text-sm text-red-300">
                                    {dto.risk.blocking_reason || 'Insufficient data or governance constraints prevent analysis.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dashboard Content */}
                {!loading && !error && dto && dto.state.governance_status !== 'blocked' && (
                    <div className="space-y-6">
                        {/* Row 1: State + Trend */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <DecisionBlock question="1. How critical is the current state?">
                                <StateBlock state={dto.state} />
                            </DecisionBlock>

                            <DecisionBlock question="2. Is the development stable, better or worse?">
                                <TrendBlock
                                    trend={dto.trend}
                                    history={history.map(h => ({
                                        week_start: h.week_start,
                                        strain: h.indices?.strain,
                                        withdrawal: h.indices?.withdrawal,
                                    }))}
                                />
                            </DecisionBlock>
                        </div>

                        {/* Row 2: Drivers + Influence */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <DecisionBlock question="3. What are the main drivers?">
                                <DriversBlock
                                    topRisks={dto.drivers.top_risks}
                                    topStrengths={dto.drivers.top_strengths}
                                />
                            </DecisionBlock>

                            <DecisionBlock question="4. Which drivers are in our influence?">
                                <InfluenceBlock
                                    drivers={[...dto.drivers.top_risks, ...dto.drivers.top_strengths]}
                                />
                            </DecisionBlock>
                        </div>

                        {/* Row 3: Action */}
                        <DecisionBlock question="5. What concrete action is sensible now?">
                            <ActionBlock
                                recommended={dto.action.recommended}
                                alternatives={dto.action.alternatives}
                            />
                        </DecisionBlock>

                        {/* Audit Footer */}
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/50">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-slate-300">{dto.audit.sessions_count}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Sessions</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-slate-300">
                                    {Math.round(dto.audit.participation_rate * 100)}%
                                </div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Participation</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-slate-300">{dto.meta.range_weeks}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Weeks Data</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && !dto && (
                    <EmptyState message="Select an Organization, Team, and Week to begin analysis." />
                )}

                {/* Dev: DTO Inspector */}
                {isDev && dto && (
                    <div className="mt-8 pt-8 border-t border-slate-800">
                        <button
                            onClick={() => setShowDto(!showDto)}
                            className="text-xs text-slate-500 hover:text-slate-300 uppercase font-mono"
                        >
                            {showDto ? 'Hide' : 'Inspect'} DTO
                        </button>
                        {showDto && (
                            <pre className="mt-4 p-4 bg-black/60 rounded-xl text-[10px] text-slate-500 overflow-auto max-h-96">
                                {JSON.stringify(dto, null, 2)}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

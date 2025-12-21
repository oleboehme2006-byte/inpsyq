'use client';

import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { TeamDashboardDTO } from '@/lib/dashboard/types';
import DemoConfig, { DemoSettings } from '@/components/admin/DemoConfig';
import { IndexPanel } from '@/components/viz/IndexPanel';
import { RiskSpace } from '@/components/viz/RiskSpace';

// Lazy load heavy components
const UncertaintyBand = dynamic(
    () => import('@/components/viz/UncertaintyBand').then(m => ({ default: m.UncertaintyBand })),
    { ssr: false, loading: () => <div className="h-32 bg-slate-900/50 animate-pulse rounded-xl" /> }
);

const CausalGraph = dynamic(
    () => import('@/components/viz/CausalGraph').then(m => ({ default: m.CausalGraph })),
    { ssr: false, loading: () => <div className="h-48 bg-slate-900/50 animate-pulse rounded-xl" /> }
);

interface RenderDiagnostics {
    request_id: string;
    dto_loaded_at: number;
    render_started_at: number;
    render_duration_ms?: number;
}

/**
 * TeamleadDashboardPage - Scientific Instrument Panel
 * 
 * No questions, no explanations, no recommendations.
 * Self-explanatory through structure and motion.
 */
function TeamleadDashboardPage() {
    const [settings, setSettings] = useState<DemoSettings | null>(null);
    const [dto, setDto] = useState<TeamDashboardDTO | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDiag, setShowDiag] = useState(false);
    const [diagnostics, setDiagnostics] = useState<RenderDiagnostics | null>(null);

    const isDev = process.env.NODE_ENV !== 'production';

    const loadData = useCallback(async (cfg: DemoSettings) => {
        setLoading(true);
        setError(null);
        setSettings(cfg);
        const loadStart = Date.now();

        try {
            const [dtoRes, histRes] = await Promise.all([
                fetch(`/api/admin/team-dashboard?org_id=${cfg.orgId}&team_id=${cfg.teamId}&week_start=${cfg.weekStart}`),
                fetch(`/api/admin/weekly?org_id=${cfg.orgId}&team_id=${cfg.teamId}`),
            ]);

            if (!dtoRes.ok) throw new Error(await dtoRes.text());

            const dtoData: TeamDashboardDTO = await dtoRes.json();
            setDto(dtoData);

            if (histRes.ok) {
                const histData = await histRes.json();
                if (Array.isArray(histData)) {
                    setHistory(histData.sort((a: any, b: any) =>
                        new Date(a.week_start).getTime() - new Date(b.week_start).getTime()
                    ));
                }
            }

            setDiagnostics({
                request_id: dtoData.meta.request_id,
                dto_loaded_at: Date.now(),
                render_started_at: loadStart,
                render_duration_ms: Date.now() - loadStart,
            });

        } catch (err: any) {
            console.error('[Dashboard]', err);
            setError(err.message || 'Load failed');
        } finally {
            setLoading(false);
        }
    }, []);

    // Transform history to uncertainty band format
    const dynamicsData = useMemo(() => {
        return history.map(h => ({
            time: h.week_start,
            mean: h.indices?.strain || 0.5,
            lower: Math.max(0, (h.indices?.strain || 0.5) - 0.15),
            upper: Math.min(1, (h.indices?.strain || 0.5) + 0.15),
        }));
    }, [history]);

    // Transform drivers to causal graph format
    const causalData = useMemo(() => {
        if (!dto) return { nodes: [], edges: [] };

        const allDrivers = [...dto.drivers.top_risks, ...dto.drivers.top_strengths];
        const nodes = allDrivers.slice(0, 8).map(d => ({
            id: d.construct,
            label: d.label,
            value: d.impact,
            uncertainty: d.uncertainty,
        }));

        // Create edges based on scope relationships
        const edges = allDrivers.slice(0, 4).flatMap(d =>
            allDrivers.slice(4, 8).map(t => ({
                from: d.construct,
                to: t.construct,
                strength: (d.impact + t.impact) / 2,
                causalLabel: d.causal_label === 'likely_causal' ? 'likely' as const : 'correlational' as const,
            }))
        );

        return { nodes, edges };
    }, [dto]);

    // Epistemic state label
    const epistemicState = useMemo(() => {
        if (!dto) return 'unknown';
        if (dto.audit.missingness > 0.5) return 'limited';
        if (dto.trend.regime === 'noise') return 'volatile';
        return 'stable';
    }, [dto]);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-300 font-light selection:bg-purple-900/30">
            {/* Header Context Layer */}
            <header className="border-b border-slate-900 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600/50 to-indigo-600/50" />
                        <div className="text-[11px] uppercase tracking-[0.3em] text-slate-600">
                            {settings?.teamId ? `${settings.orgId.slice(0, 4)}···${settings.teamId.slice(-4)}` : 'select context'}
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] text-slate-700 uppercase tracking-wider">
                        <span>{settings?.weekStart || '—'}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-800" />
                        <span className={epistemicState === 'stable' ? 'text-slate-500' : 'text-amber-600'}>
                            {epistemicState}
                        </span>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
                {/* Config (dev mode style) */}
                <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                    <DemoConfig onConfigApply={loadData} />
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="grid grid-cols-4 gap-6 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-48 bg-slate-900/30 rounded-2xl" />
                        ))}
                    </div>
                )}

                {/* Error State (silent, non-disruptive) */}
                {error && (
                    <div className="text-center py-12 text-slate-600 text-sm">
                        <span className="opacity-50">signal unavailable</span>
                    </div>
                )}

                {/* Dashboard Content */}
                {!loading && !error && dto && (
                    <div className="space-y-12">
                        {/* Core Indices (Hero Layer) */}
                        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-slate-900/20 border border-slate-800/30 rounded-2xl p-2">
                                <IndexPanel
                                    name="strain"
                                    mean={dto.indices.strain_index}
                                    uncertainty={dto.risk.epistemic}
                                    trend={dto.trend.direction === 'DETERIORATING' ? 0.3 : dto.trend.direction === 'IMPROVING' ? -0.3 : 0}
                                    volatility={dto.trend.volatility}
                                    theme="strain"
                                    explainToken={`strain-${dto.meta.request_id}`}
                                />
                            </div>
                            <div className="bg-slate-900/20 border border-slate-800/30 rounded-2xl p-2">
                                <IndexPanel
                                    name="trust gap"
                                    mean={dto.indices.trust_gap}
                                    uncertainty={dto.risk.epistemic * 1.2}
                                    trend={dto.trend.velocity}
                                    volatility={dto.trend.volatility * 0.8}
                                    theme="trust"
                                    explainToken={`trust-${dto.meta.request_id}`}
                                />
                            </div>
                            <div className="bg-slate-900/20 border border-slate-800/30 rounded-2xl p-2">
                                <IndexPanel
                                    name="withdrawal"
                                    mean={dto.indices.withdrawal_risk}
                                    uncertainty={dto.risk.epistemic}
                                    trend={0}
                                    volatility={dto.trend.volatility * 0.6}
                                    theme="withdrawal"
                                    explainToken={`withdrawal-${dto.meta.request_id}`}
                                />
                            </div>
                            <div className="bg-slate-900/20 border border-slate-800/30 rounded-2xl p-2">
                                <IndexPanel
                                    name="engagement"
                                    mean={dto.indices.engagement_index || 0.5}
                                    uncertainty={dto.risk.epistemic * 1.5}
                                    trend={dto.trend.direction === 'IMPROVING' ? 0.2 : -0.1}
                                    volatility={dto.trend.volatility}
                                    theme="engagement"
                                    explainToken={`engagement-${dto.meta.request_id}`}
                                />
                            </div>
                        </section>

                        {/* Latent Dynamics Layer */}
                        <section className="bg-slate-900/20 border border-slate-800/30 rounded-2xl p-6">
                            <div className="text-[9px] uppercase tracking-[0.3em] text-slate-700 mb-4">
                                temporal dynamics
                            </div>
                            <UncertaintyBand
                                data={dynamicsData}
                                height={140}
                                theme="strain"
                                label="μ ± σ"
                                explainToken={`dynamics-${dto.meta.request_id}`}
                            />
                        </section>

                        {/* Driver & Causality Layer */}
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-slate-900/20 border border-slate-800/30 rounded-2xl p-6">
                                <div className="text-[9px] uppercase tracking-[0.3em] text-slate-700 mb-4">
                                    influence structure
                                </div>
                                <CausalGraph
                                    nodes={causalData.nodes}
                                    edges={causalData.edges}
                                    height={220}
                                    explainToken={`causal-${dto.meta.request_id}`}
                                />
                            </div>

                            {/* Risk & Stability Layer */}
                            <div className="bg-slate-900/20 border border-slate-800/30 rounded-2xl p-6">
                                <div className="text-[9px] uppercase tracking-[0.3em] text-slate-700 mb-4">
                                    risk space
                                </div>
                                <RiskSpace
                                    epistemic={dto.risk.epistemic}
                                    ethical={dto.risk.ethical}
                                    organizational={dto.risk.organizational}
                                    blocked={dto.state.governance_status === 'blocked'}
                                    height={180}
                                    explainToken={`risk-${dto.meta.request_id}`}
                                />
                            </div>
                        </section>

                        {/* Contextual / Secondary (collapsed) */}
                        <section className="opacity-50 hover:opacity-100 transition-opacity duration-500">
                            <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.3em] text-slate-700 mb-4">
                                <span>diagnostics</span>
                                <div className="flex-grow h-px bg-slate-800/50" />
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-[10px] text-slate-600">
                                <div>
                                    <span className="text-slate-700">n </span>
                                    {dto.audit.sessions_count}
                                </div>
                                <div>
                                    <span className="text-slate-700">coverage </span>
                                    {Math.round(dto.audit.participation_rate * 100)}%
                                </div>
                                <div>
                                    <span className="text-slate-700">weeks </span>
                                    {dto.meta.range_weeks}
                                </div>
                                <div>
                                    <span className="text-slate-700">latency </span>
                                    {dto.meta.duration_ms}ms
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && !dto && (
                    <div className="text-center py-24 text-slate-700 text-[11px] uppercase tracking-widest">
                        awaiting context
                    </div>
                )}

                {/* Dev Diagnostics */}
                {isDev && dto && (
                    <div className="border-t border-slate-900 pt-6 mt-12">
                        <button
                            onClick={() => setShowDiag(!showDiag)}
                            className="text-[9px] uppercase tracking-widest text-slate-700 hover:text-slate-500"
                        >
                            {showDiag ? '× close' : '◇ diagnostics'}
                        </button>
                        {showDiag && diagnostics && (
                            <div className="mt-4 p-4 bg-black/40 rounded-xl font-mono text-[10px] text-slate-600">
                                <div>request_id: {diagnostics.request_id}</div>
                                <div>render_duration: {diagnostics.render_duration_ms}ms</div>
                                <div>dto_version: 1.0</div>
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-slate-500">raw dto</summary>
                                    <pre className="mt-2 max-h-48 overflow-auto text-[9px]">
                                        {JSON.stringify(dto, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

export default memo(TeamleadDashboardPage);

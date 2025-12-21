'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { ExecutiveDashboardDTO } from '@/lib/dashboard/types';
import { LatentField } from '@/components/viz/LatentField';
import { RiskSpace } from '@/components/viz/RiskSpace';
import { safeNumber } from '@/lib/utils/safeNumber';

// Lazy load heavy components
const CausalGraph = dynamic(
    () => import('@/components/viz/CausalGraph').then(m => ({ default: m.CausalGraph })),
    { ssr: false, loading: () => <div className="h-48 bg-slate-900/30 animate-pulse rounded-xl" /> }
);

/**
 * ExecutiveDashboardPage - Portfolio Overview Instrument
 * 
 * No questions, no recommendations.
 * Teams as latent fields, systemic patterns as graph.
 */
function ExecutiveDashboardPage() {
    const [orgId, setOrgId] = useState('');
    const [dto, setDto] = useState<ExecutiveDashboardDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDiag, setShowDiag] = useState(false);

    const isDev = process.env.NODE_ENV !== 'production';

    const loadData = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/executive-dashboard?org_id=${orgId}`);
            if (!res.ok) throw new Error(await res.text());
            const data: ExecutiveDashboardDTO = await res.json();
            setDto(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    // Transform systemic drivers to causal graph
    const systemicGraph = useMemo(() => {
        if (!dto) return { nodes: [], edges: [] };

        const nodes = dto.systemic_drivers.map(d => ({
            id: d.construct,
            label: d.label,
            value: d.aggregate_impact,
            uncertainty: 0.3,
        }));

        // Create edges between drivers affecting same teams
        const edges: any[] = [];
        dto.systemic_drivers.forEach((d1, i) => {
            dto.systemic_drivers.slice(i + 1).forEach(d2 => {
                const overlap = d1.affected_teams.filter(t => d2.affected_teams.includes(t));
                if (overlap.length > 0) {
                    edges.push({
                        from: d1.construct,
                        to: d2.construct,
                        strength: overlap.length / Math.max(d1.affected_teams.length, d2.affected_teams.length),
                        causalLabel: 'correlational' as const,
                    });
                }
            });
        });

        return { nodes, edges };
    }, [dto]);

    // Epistemic state
    const epistemicState = useMemo(() => {
        if (!dto) return 'unknown';
        if (dto.audit.missingness > 0.5) return 'limited';
        if (dto.governance_summary.blocked_teams.length > 0) return 'partial';
        return 'stable';
    }, [dto]);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-300 font-light selection:bg-purple-900/30">
            {/* Header */}
            <header className="border-b border-slate-900 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600/50 to-purple-600/50" />
                        <div className="text-[11px] uppercase tracking-[0.3em] text-slate-600">
                            portfolio
                        </div>
                    </div>
                    <div className="text-[10px] text-slate-700 uppercase tracking-wider">
                        {epistemicState}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
                {/* Context Input */}
                <div className="flex gap-4 items-end bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6">
                    <div className="flex-grow">
                        <label className="block text-[9px] uppercase tracking-[0.2em] text-slate-600 mb-2">
                            organization
                        </label>
                        <input
                            type="text"
                            value={orgId}
                            onChange={(e) => setOrgId(e.target.value)}
                            placeholder="uuid"
                            className="w-full bg-slate-900/50 border border-slate-800/50 rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-600/50"
                        />
                    </div>
                    <button
                        onClick={loadData}
                        disabled={loading || !orgId}
                        className="px-6 py-3 bg-purple-600/20 hover:bg-purple-600/30 disabled:bg-slate-800/20 border border-purple-600/30 rounded-xl text-sm text-purple-300 transition-colors"
                    >
                        {loading ? '···' : 'load'}
                    </button>
                </div>

                {/* Error (silent) */}
                {error && (
                    <div className="text-center py-8 text-slate-700 text-[10px] uppercase tracking-widest">
                        signal unavailable
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="grid grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-slate-900/30 rounded-2xl" />
                        ))}
                    </div>
                )}

                {/* Dashboard */}
                {!loading && !error && dto && (
                    <div className="space-y-12">
                        {/* Org-Level Indices */}
                        <section className="grid grid-cols-3 gap-6">
                            <div className="bg-slate-900/20 border border-slate-800/30 rounded-2xl p-6 flex flex-col items-center">
                                <LatentField
                                    mean={dto.org_indices.strain_index}
                                    uncertainty={dto.audit.missingness}
                                    trend={dto.org_trend.direction === 'DETERIORATING' ? 0.3 : -0.1}
                                    volatility={dto.org_trend.volatility}
                                    theme="strain"
                                    size={120}
                                />
                                <div className="mt-4 text-[9px] uppercase tracking-[0.3em] text-slate-600">
                                    aggregate strain
                                </div>
                            </div>
                            <div className="bg-slate-900/20 border border-slate-800/30 rounded-2xl p-6 flex flex-col items-center">
                                <LatentField
                                    mean={dto.org_indices.trust_gap}
                                    uncertainty={dto.audit.missingness * 1.2}
                                    trend={0}
                                    volatility={dto.org_trend.volatility * 0.8}
                                    theme="trust"
                                    size={120}
                                />
                                <div className="mt-4 text-[9px] uppercase tracking-[0.3em] text-slate-600">
                                    trust gap
                                </div>
                            </div>
                            <div className="bg-slate-900/20 border border-slate-800/30 rounded-2xl p-6 flex flex-col items-center">
                                <RiskSpace
                                    epistemic={dto.audit.missingness}
                                    ethical={0.1}
                                    organizational={dto.org_state.severity}
                                    blocked={dto.meta.governance_blocked}
                                    height={140}
                                />
                                <div className="mt-2 text-[9px] uppercase tracking-[0.3em] text-slate-600">
                                    risk surface
                                </div>
                            </div>
                        </section>

                        {/* Team Portfolio (Fields Grid) */}
                        <section>
                            <div className="text-[9px] uppercase tracking-[0.3em] text-slate-700 mb-6">
                                unit states
                            </div>
                            <div className="grid grid-cols-4 lg:grid-cols-6 gap-4">
                                {dto.teams.map(team => (
                                    <a
                                        key={team.team_id}
                                        href={`/admin/teamlead?team=${team.team_id}`}
                                        className="bg-slate-900/20 border border-slate-800/30 rounded-xl p-4 flex flex-col items-center hover:border-purple-600/30 transition-colors group"
                                    >
                                        <LatentField
                                            mean={team.severity}
                                            uncertainty={0.3}
                                            trend={team.trend_direction === 'DETERIORATING' ? 0.2 : team.trend_direction === 'IMPROVING' ? -0.2 : 0}
                                            volatility={Math.abs(team.velocity)}
                                            theme={team.state_label === 'CRITICAL' ? 'strain' : team.state_label === 'AT_RISK' ? 'withdrawal' : 'neutral'}
                                            size={60}
                                        />
                                        <div className="mt-2 text-[8px] text-slate-600 group-hover:text-slate-400 transition-colors truncate max-w-full">
                                            {team.team_name.slice(0, 12)}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </section>

                        {/* Systemic Drivers Graph */}
                        {systemicGraph.nodes.length > 0 && (
                            <section className="bg-slate-900/20 border border-slate-800/30 rounded-2xl p-6">
                                <div className="text-[9px] uppercase tracking-[0.3em] text-slate-700 mb-4">
                                    systemic patterns
                                </div>
                                <CausalGraph
                                    nodes={systemicGraph.nodes}
                                    edges={systemicGraph.edges}
                                    height={200}
                                    explainToken={`systemic-${dto.meta.request_id}`}
                                />
                            </section>
                        )}

                        {/* Distribution (subtle) */}
                        <section className="opacity-60 hover:opacity-100 transition-opacity duration-500">
                            <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.3em] text-slate-700 mb-4">
                                <span>distribution</span>
                                <div className="flex-grow h-px bg-slate-800/50" />
                            </div>
                            <div className="flex gap-8 justify-center text-[10px]">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                    <span className="text-slate-500">{dto.risk_distribution.critical} critical</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                                    <span className="text-slate-500">{dto.risk_distribution.at_risk} elevated</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                    <span className="text-slate-500">{dto.risk_distribution.healthy} stable</span>
                                </div>
                            </div>
                        </section>

                        {/* Diagnostics */}
                        <section className="opacity-40 hover:opacity-80 transition-opacity">
                            <div className="grid grid-cols-4 gap-4 text-[10px] text-slate-700">
                                <div>n: {dto.audit.sessions_count}</div>
                                <div>coverage: {Math.round(dto.governance_summary.coverage_rate * 100)}%</div>
                                <div>blocked: {dto.governance_summary.blocked_teams.length}</div>
                                <div>latency: {dto.meta.duration_ms}ms</div>
                            </div>
                        </section>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && !dto && (
                    <div className="text-center py-24 text-slate-700 text-[11px] uppercase tracking-widest">
                        awaiting organization
                    </div>
                )}

                {/* Dev Panel */}
                {isDev && dto && (
                    <div className="border-t border-slate-900 pt-6 mt-12">
                        <button
                            onClick={() => setShowDiag(!showDiag)}
                            className="text-[9px] uppercase tracking-widest text-slate-700 hover:text-slate-500"
                        >
                            {showDiag ? '× close' : '◇ diagnostics'}
                        </button>
                        {showDiag && (
                            <pre className="mt-4 p-4 bg-black/40 rounded-xl text-[9px] text-slate-600 max-h-64 overflow-auto">
                                {JSON.stringify(dto, null, 2)}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

export default memo(ExecutiveDashboardPage);

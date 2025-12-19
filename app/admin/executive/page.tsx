'use client';

import React, { useState } from 'react';
import { ExecutiveDashboardDTO, TeamSummary, SystemicDriverCluster } from '@/lib/dashboard/types';
import DecisionBlock, { EmptyState } from '@/components/admin/dashboard/DecisionBlock';
import StateBlock from '@/components/admin/dashboard/StateBlock';
import { safeToFixed } from '@/lib/utils/safeNumber';

export default function ExecutiveDashboardPage() {
    const [orgId, setOrgId] = useState('');
    const [dto, setDto] = useState<ExecutiveDashboardDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDto, setShowDto] = useState(false);

    const loadData = async () => {
        if (!orgId) {
            setError('Please enter an Organization ID');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/executive-dashboard?org_id=${orgId}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `HTTP ${res.status}`);
            }
            const data: ExecutiveDashboardDTO = await res.json();
            setDto(data);
        } catch (err: any) {
            console.error('[ExecutiveDashboard]', err);
            setError(err.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const isDev = process.env.NODE_ENV !== 'production';

    const getSeverityColor = (severity: number) => {
        if (severity >= 0.7) return 'bg-red-500';
        if (severity >= 0.4) return 'bg-amber-500';
        return 'bg-green-500';
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-900 selection:text-white">
            {/* Header */}
            <div className="border-b border-slate-800 bg-black/40 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
                            EX
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-100 leading-tight">Executive Dashboard</h1>
                            <p className="text-xs text-slate-500">Portfolio Overview</p>
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
                    <div className="flex gap-4 items-end">
                        <div className="flex-grow">
                            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                                Organization ID
                            </label>
                            <input
                                type="text"
                                value={orgId}
                                onChange={(e) => setOrgId(e.target.value)}
                                placeholder="Enter org UUID..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 rounded-lg font-medium transition-colors"
                        >
                            {loading ? 'Loading...' : 'Load Dashboard'}
                        </button>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="p-6 bg-red-900/20 border border-red-800/50 text-red-200 rounded-xl">
                        <h3 className="font-bold text-lg mb-2">Dashboard Error</h3>
                        <p>{error}</p>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <DecisionBlock key={i} question="Loading..." loading className="h-48" />
                        ))}
                    </div>
                )}

                {/* Dashboard Content */}
                {!loading && !error && dto && (
                    <div className="space-y-6">
                        {/* Row 1: Org State + Risk Distribution */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DecisionBlock question="Overall Organization State" className="lg:col-span-2">
                                <StateBlock state={dto.org_state} />
                            </DecisionBlock>

                            <DecisionBlock question="Risk Distribution">
                                <div className="flex flex-col h-full justify-center">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-red-900/40 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-red-400">{dto.risk_distribution.critical}</span>
                                        </div>
                                        <span className="text-sm text-slate-400">Critical Teams</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-900/40 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-amber-400">{dto.risk_distribution.at_risk}</span>
                                        </div>
                                        <span className="text-sm text-slate-400">At Risk Teams</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-green-900/40 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-green-400">{dto.risk_distribution.healthy}</span>
                                        </div>
                                        <span className="text-sm text-slate-400">Healthy Teams</span>
                                    </div>
                                </div>
                            </DecisionBlock>
                        </div>

                        {/* Row 2: Team Portfolio */}
                        <DecisionBlock question="Team Portfolio (Ranked by Severity × Trend)">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                            <th className="text-left py-2 px-2">Rank</th>
                                            <th className="text-left py-2 px-2">Team</th>
                                            <th className="text-left py-2 px-2">State</th>
                                            <th className="text-left py-2 px-2">Severity</th>
                                            <th className="text-left py-2 px-2">Trend</th>
                                            <th className="text-left py-2 px-2">Governance</th>
                                            <th className="text-left py-2 px-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dto.team_ranking.map((rank) => {
                                            const team = dto.teams.find(t => t.team_id === rank.team_id);
                                            if (!team) return null;

                                            return (
                                                <tr key={team.team_id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                                    <td className="py-3 px-2">
                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rank.rank <= 3 ? 'bg-red-900/50 text-red-300' : 'bg-slate-800 text-slate-400'
                                                            }`}>
                                                            {rank.rank}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2 font-medium text-slate-200">{team.team_name}</td>
                                                    <td className="py-3 px-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${team.state_label === 'CRITICAL' ? 'bg-red-900/50 text-red-300' :
                                                                team.state_label === 'AT_RISK' ? 'bg-amber-900/50 text-amber-300' :
                                                                    'bg-green-900/50 text-green-300'
                                                            }`}>
                                                            {team.state_label}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${getSeverityColor(team.severity)}`}
                                                                    style={{ width: `${team.severity * 100}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-slate-500">
                                                                {safeToFixed(team.severity * 100, 0)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <span className={
                                                            team.trend_direction === 'IMPROVING' ? 'text-green-400' :
                                                                team.trend_direction === 'DETERIORATING' ? 'text-red-400' :
                                                                    'text-slate-400'
                                                        }>
                                                            {team.trend_direction === 'IMPROVING' ? '↑' :
                                                                team.trend_direction === 'DETERIORATING' ? '↓' : '→'}
                                                            {' '}{team.trend_direction}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <span className={`text-xs ${team.governance_status === 'blocked' ? 'text-red-400' :
                                                                team.governance_status === 'review_needed' ? 'text-amber-400' :
                                                                    'text-green-400'
                                                            }`}>
                                                            {team.governance_status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <a
                                                            href={`/admin/teamlead?team=${team.team_id}`}
                                                            className="text-xs text-purple-400 hover:text-purple-300 underline"
                                                        >
                                                            View →
                                                        </a>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </DecisionBlock>

                        {/* Row 3: Systemic Drivers */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <DecisionBlock question="Systemic Drivers (Cross-Team)">
                                {dto.systemic_drivers.length === 0 ? (
                                    <EmptyState message="No systemic drivers detected across teams" />
                                ) : (
                                    <div className="space-y-3">
                                        {dto.systemic_drivers.map(d => (
                                            <div key={d.construct} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-slate-200">{d.label}</span>
                                                    <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded">
                                                        {d.scope}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                    <span>Impact: {safeToFixed(d.aggregate_impact * 100, 0)}%</span>
                                                    <span>Affects: {d.affected_teams.length} teams</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </DecisionBlock>

                            <DecisionBlock question="Governance Summary">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
                                        <span className="text-slate-400">Data Coverage</span>
                                        <span className="text-lg font-bold text-slate-200">
                                            {safeToFixed(dto.governance_summary.coverage_rate * 100, 0)}%
                                        </span>
                                    </div>
                                    {dto.governance_summary.blocked_teams.length > 0 && (
                                        <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
                                            <div className="text-sm font-medium text-red-300 mb-1">
                                                Blocked Teams ({dto.governance_summary.blocked_teams.length})
                                            </div>
                                            <div className="text-xs text-red-400">
                                                Analysis suspended due to governance constraints
                                            </div>
                                        </div>
                                    )}
                                    {dto.governance_summary.review_needed_teams.length > 0 && (
                                        <div className="p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg">
                                            <div className="text-sm font-medium text-amber-300 mb-1">
                                                Review Needed ({dto.governance_summary.review_needed_teams.length})
                                            </div>
                                            <div className="text-xs text-amber-400">
                                                Manual review recommended before action
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/50">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-slate-300">{dto.audit.sessions_count}</div>
                                            <div className="text-xs text-slate-500 uppercase">Total Sessions</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-slate-300">
                                                {safeToFixed(dto.audit.participation_rate * 100, 0)}%
                                            </div>
                                            <div className="text-xs text-slate-500 uppercase">Avg Participation</div>
                                        </div>
                                    </div>
                                </div>
                            </DecisionBlock>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && !dto && (
                    <EmptyState message="Enter an Organization ID and click Load Dashboard to begin." />
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

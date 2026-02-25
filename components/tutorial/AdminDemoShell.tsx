'use client';

import React from 'react';
import { Activity, Users, Play, ShieldCheck, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

/**
 * AdminDemoShell — Static replica of the admin UI for the tutorial.
 * No real DB queries, no server-only imports — purely presentational.
 * Uses data-tutorial-* attributes for spotlight targeting.
 */
export function AdminDemoShell() {
    return (
        <div className="min-h-screen bg-bg-base text-text-primary p-8 max-w-[1400px] mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white">Admin Console</h1>
                    <p className="text-text-tertiary text-sm font-mono mt-1">TechVentures GmbH · ADMIN</p>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    System Healthy
                </div>
            </div>

            {/* Roster Section */}
            <div data-tutorial="admin-roster" className="mb-10 p-6 rounded-2xl border border-white/10 bg-[#050505]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-[#8B5CF6]" />
                        <h2 className="text-lg font-display font-semibold text-white">Org Roster</h2>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-text-secondary text-xs font-mono hover:bg-white/10 transition-colors">
                            Import CSV
                        </button>
                        <button className="px-4 py-2 rounded-lg bg-[#8B5CF6] text-white text-xs font-mono hover:bg-[#7C3AED] transition-colors">
                            + Invite Member
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Total Members', value: '19', sub: 'across 3 teams' },
                        { label: 'Active This Week', value: '17', sub: '89% participation' },
                        { label: 'Pending Invites', value: '2', sub: 'awaiting signup' },
                    ].map(stat => (
                        <div key={stat.label} className="p-4 rounded-xl bg-white/3 border border-white/5">
                            <div className="text-2xl font-display font-bold text-white">{stat.value}</div>
                            <div className="text-xs text-text-tertiary mt-1">{stat.label}</div>
                            <div className="text-xs text-text-tertiary/60 font-mono">{stat.sub}</div>
                        </div>
                    ))}
                </div>
                <div className="space-y-2">
                    {[
                        { name: 'Sarah Chen', role: 'EXECUTIVE', team: '—', status: 'Active' },
                        { name: 'Marcus Weber', role: 'TEAMLEAD', team: 'Platform', status: 'Active' },
                        { name: 'Priya Nair', role: 'TEAMLEAD', team: 'Product', status: 'Active' },
                        { name: 'invite@techventures.de', role: 'EMPLOYEE', team: 'Growth', status: 'Pending' },
                    ].map(member => (
                        <div key={member.name} className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/2 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-text-secondary">
                                    {member.name[0]}
                                </div>
                                <span className="text-sm text-white">{member.name}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-xs font-mono text-text-tertiary">{member.team}</span>
                                <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                                    member.role === 'EXECUTIVE' ? 'text-[#0EA5E9] bg-[#0EA5E9]/10' :
                                    member.role === 'TEAMLEAD' ? 'text-[#8B5CF6] bg-[#8B5CF6]/10' :
                                    'text-text-tertiary bg-white/5'
                                }`}>{member.role}</span>
                                <span className={`text-xs font-mono ${member.status === 'Pending' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {member.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pipeline Section */}
            <div data-tutorial="admin-pipeline" className="mb-10 p-6 rounded-2xl border border-white/10 bg-[#050505]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Play className="w-5 h-5 text-[#10B981]" />
                        <h2 className="text-lg font-display font-semibold text-white">Weekly Pipeline</h2>
                    </div>
                    <span className="text-xs font-mono text-text-tertiary">Week of Nov 18, 2025</span>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Teams Processed', value: '3/3', color: 'text-emerald-400' },
                        { label: 'Interpretations', value: '3 generated', color: 'text-[#8B5CF6]' },
                        { label: 'Duration', value: '4m 12s', color: 'text-text-secondary' },
                        { label: 'Last Run', value: 'Mon 06:01 AM', color: 'text-text-tertiary' },
                    ].map(s => (
                        <div key={s.label} className="p-4 rounded-xl bg-white/3 border border-white/5">
                            <div className={`text-lg font-display font-bold ${s.color}`}>{s.value}</div>
                            <div className="text-xs text-text-tertiary mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-sm font-medium hover:bg-[#10B981]/20 transition-colors">
                        <Play className="w-4 h-4" /> Run Pipeline
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-text-secondary text-sm font-medium hover:bg-white/10 transition-colors">
                        Dry Run
                    </button>
                </div>
            </div>

            {/* System Health Section */}
            <div data-tutorial="admin-health" className="mb-10 p-6 rounded-2xl border border-white/10 bg-[#050505]">
                <div className="flex items-center gap-3 mb-6">
                    <Activity className="w-5 h-5 text-[#0EA5E9]" />
                    <h2 className="text-lg font-display font-semibold text-white">System Health</h2>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    {[
                        { label: 'Stuck Locks', value: '0', icon: CheckCircle, color: 'text-emerald-400' },
                        { label: 'Missing Interpretations', value: '0', icon: CheckCircle, color: 'text-emerald-400' },
                        { label: 'Active Alerts', value: '1', icon: AlertTriangle, color: 'text-amber-400' },
                    ].map(item => (
                        <div key={item.label} className="p-4 rounded-xl bg-white/3 border border-white/5 flex items-center gap-3">
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                            <div>
                                <div className={`text-xl font-display font-bold ${item.color}`}>{item.value}</div>
                                <div className="text-xs text-text-tertiary">{item.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
                    <Clock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <div className="text-sm text-white font-medium">Low Participation Warning</div>
                        <div className="text-xs text-text-tertiary mt-0.5">Growth team: 60% response rate this week (threshold: 70%). Consider sending a reminder.</div>
                    </div>
                </div>
            </div>

            {/* Data Governance Section */}
            <div data-tutorial="admin-governance" className="p-6 rounded-2xl border border-white/10 bg-[#050505]">
                <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
                    <h2 className="text-lg font-display font-semibold text-white">Data Governance</h2>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: 'Org Coverage', value: '87%', sub: 'of members responded' },
                        { label: 'Data Quality', value: '82%', sub: 'avg signal confidence' },
                        { label: 'Total Sessions', value: '214', sub: 'this quarter' },
                        { label: 'Anonymity k', value: 'k ≥ 4', sub: 'all teams meet threshold' },
                    ].map(g => (
                        <div key={g.label} className="p-4 rounded-xl bg-white/3 border border-white/5">
                            <div className="text-xl font-display font-bold text-white">{g.value}</div>
                            <div className="text-xs text-text-tertiary mt-1">{g.label}</div>
                            <div className="text-xs text-text-tertiary/60 font-mono">{g.sub}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import { DemoSettings } from './DemoConfig';
import { motion } from 'framer-motion';
import {
    transformProfiles,
    transformDrivers,
    VizProfile,
    RawProfileRow,
    RawAuditPayload,
    PROFILE_METRICS,
    normalizeToStability,
    getIndexZone,
    INDICES_METRICS
} from '@/lib/visualization/mapping';
import MetricGauge from '@/components/admin/viz/MetricGauge';
import DriverAnalysis from '@/components/admin/viz/DriverAnalysis';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DemoDashboardProps {
    settings: DemoSettings;
}

export default function DemoDashboard({ settings }: DemoDashboardProps) {
    // Raw Payloads
    const [rawProfiles, setRawProfiles] = useState<RawProfileRow[] | null>(null);
    const [rawAudit, setRawAudit] = useState<RawAuditPayload | null>(null);
    const [rawWeekly, setRawWeekly] = useState<any[] | null>(null);

    // Derived Visual State
    const [vizHistory, setVizHistory] = useState<VizProfile[]>([]);
    const [currentViz, setCurrentViz] = useState<VizProfile['metrics'] | null>(null);
    const [drivers, setDrivers] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPayloads, setShowPayloads] = useState(false);

    useEffect(() => {
        if (!settings) return;

        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch profiles (History)
                const profRes = await fetch(`/api/admin/profiles?org_id=${settings.orgId}&team_id=${settings.teamId}`);
                // Fetch Audit (Specific week)
                const auditRes = await fetch(`/api/admin/audit/team-contributions?org_id=${settings.orgId}&team_id=${settings.teamId}&week_start=${settings.weekStart}`);
                // Fetch Weekly (for indices history)
                const weeklyRes = await fetch(`/api/admin/weekly?org_id=${settings.orgId}&team_id=${settings.teamId}`);

                if (!profRes.ok) throw new Error(`Profiles Failed: ${profRes.status}`);
                // Audit might fail if no data, which is fine, we handle it.

                const pData = await profRes.json();
                const wData = await weeklyRes.json();
                let aData = null;
                if (auditRes.ok) aData = await auditRes.json();

                setRawProfiles(pData);
                setRawAudit(aData);
                setRawWeekly(wData);

                // --- TRANSFORM DATA ---

                // 1. Pivot Profiles
                if (Array.isArray(pData)) {
                    const pivoted = transformProfiles(pData);
                    setVizHistory(pivoted);

                    const current = pivoted.find(p => p.week_start === settings.weekStart);
                    if (current) setCurrentViz(current.metrics);
                    else setCurrentViz(null); // Explicit null if not found
                }

                // 2. Transform Drivers
                if (aData) {
                    setDrivers(transformDrivers(aData));
                } else {
                    setDrivers([]);
                }

            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [settings]);

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-slate-900/50 rounded-xl border border-slate-800"></div>
            ))}
        </div>
    );

    if (error) return (
        <div className="p-4 bg-red-900/20 border border-red-800/50 text-red-200 rounded-xl text-center">
            Error loading dashboard: {error}
        </div>
    );

    // Filter Weekly History for Chart (Indices: Strain, Withdrawal)
    // We map rawWeekly to chart friendly format
    const indicesData = Array.isArray(rawWeekly) ? rawWeekly.map(w => ({
        date: new Date(w.week_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        // Raw Values (for Tooltip)
        raw_strain: w.indices?.strain || 0,
        raw_withdrawal: w.indices?.withdrawal || 0,
        raw_trust: w.indices?.trust_gap || 0,
        // Normalized Stability Scores (0-100, Higher is Better) for Plotting
        strain_norm: normalizeToStability('strain', w.indices?.strain),
        withdrawal_norm: normalizeToStability('withdrawal', w.indices?.withdrawal),
        trust_norm: normalizeToStability('trust_gap', w.indices?.trust_gap)
    })) : [];

    return (
        <div className="space-y-8">
            {/* Header / Meta */}
            <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-100">Executive Diagnostics</h2>
                    <p className="text-sm text-slate-400">
                        Coverage: {vizHistory.length} weeks loaded.
                        Target: {new Date(settings.weekStart).toLocaleDateString()}.
                    </p>
                </div>
                <button
                    onClick={() => setShowPayloads(!showPayloads)}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors uppercase font-mono"
                >
                    {showPayloads ? 'Hide Raw Payloads' : 'Inspect Payloads'}
                </button>
            </div>

            {/* MAIN DASHBOARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* 1. KEY METRICS ROW (Top - 12 Cols) */}
                {currentViz ? (
                    <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricGauge metricId="WRP" value={currentViz.WRP.value} />
                        <MetricGauge metricId="OUC" value={currentViz.OUC.value} />
                        <MetricGauge metricId="TFP" value={currentViz.TFP.value} />
                    </div>
                ) : (
                    <div className="col-span-12 p-8 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-slate-500 italic">
                        No Profile Data computed for this week.
                    </div>
                )}

                {/* 2. INDICES TREND (Left - 8 Cols) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl"
                >
                    <h3 className="text-lg font-semibold text-slate-100 mb-6">Organizational Stability Indices</h3>
                    <div className="h-[300px] w-full">
                        {indicesData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={indicesData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        ticks={[0, 25, 50, 75, 100]}
                                        tickFormatter={(val) => {
                                            if (val === 100) return 'Optimal';
                                            if (val === 75) return 'Good';
                                            if (val === 50) return 'Stable';
                                            if (val === 25) return 'Risk';
                                            if (val === 0) return 'Critical';
                                            return '';
                                        }}
                                        width={60}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    {/* Lines use Normalized "Stability Score" (Higher is Better) */}
                                    <Line
                                        type="monotone"
                                        dataKey="strain_norm"
                                        name="Organizational Strain"
                                        stroke="#f59e0b" // Amber
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="withdrawal_norm"
                                        name="Withdrawal Risk"
                                        stroke="#f43f5e" // Rose
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="trust_norm"
                                        name="Trust Divergence"
                                        stroke="#3b82f6" // Blue
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500">
                                <span>Insufficient trend data.</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 3. CONTRIBUTION DRIVERS (Right - 4 Cols) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col"
                >
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">Primary Drivers</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[300px]">
                        {drivers.length > 0 ? (
                            <DriverAnalysis contributions={
                                // Convert back to Record<string, number> for the component which we reused
                                // Or better, update component? The component expects Record<string, number>.
                                // Let's create an object from the array.
                                drivers.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {})
                            } />
                        ) : (
                            <div className="text-slate-500 text-sm">No driver audit available for this week.</div>
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500">
                        Based on {rawAudit ? Object.keys(rawAudit.parameter_contributions || {}).length : 0} observed signals.
                    </div>
                </motion.div>
            </div>

            {/* 4. RAW PAYLOADS INSPECTOR (Collapsible) */}
            {showPayloads && (
                <div className="border border-slate-700 rounded-xl overflow-hidden">
                    <div className="bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Raw API Payloads (Debug)
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-slate-700 bg-black/60 font-mono text-[10px] text-slate-400 h-64">
                        <div className="p-4 overflow-auto">
                            <div className="mb-2 text-purple-400">GET /profiles</div>
                            <pre>{JSON.stringify(rawProfiles, null, 2)}</pre>
                        </div>
                        <div className="p-4 overflow-auto">
                            <div className="mb-2 text-purple-400">GET /weekly</div>
                            <pre>{JSON.stringify(rawWeekly, null, 2)}</pre>
                        </div>
                        <div className="p-4 overflow-auto">
                            <div className="mb-2 text-purple-400">GET /audit</div>
                            <pre>{JSON.stringify(rawAudit, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        // payload[0] corresponds to the first line, but we have access to "payload[0].payload" which is the data object
        const data = payload[0].payload;

        const getItem = (id: string, rawKey: string) => {
            const raw = data[rawKey];
            const zone = getIndexZone(id, raw);
            const def = INDICES_METRICS[id];
            return { raw, zone, def };
        };

        const strain = getItem('strain', 'raw_strain');
        const withdrawal = getItem('withdrawal', 'raw_withdrawal');
        const trust = getItem('trust_gap', 'raw_trust');

        return (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl max-w-xs">
                <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide border-b border-slate-800 pb-1">
                    Stability Snapshot: {label}
                </div>
                <div className="space-y-3">
                    <TooltipRow item={strain} color="#f59e0b" />
                    <TooltipRow item={withdrawal} color="#f43f5e" />
                    <TooltipRow item={trust} color="#3b82f6" />
                </div>
            </div>
        );
    }
    return null;
}

function TooltipRow({ item, color }: { item: any, color: string }) {
    if (!item || !item.def) return null;
    return (
        <div className="flex items-start gap-2">
            {/* Legend Dot */}
            <div className="mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />

            <div className="flex-1">
                <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-xs font-medium text-slate-200">{item.def.label}</span>
                    <span className={`text-xs font-bold ${item.zone.color}`}>{item.zone.label}</span>
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                    {item.zone.description}
                </div>
            </div>
        </div>
    );
}

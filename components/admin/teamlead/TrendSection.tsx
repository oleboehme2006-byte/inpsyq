import React from 'react';
import { DecisionTrend } from '@/services/decision/types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { normalizeToStability, INDICES_METRICS, getIndexZone } from '@/lib/visualization/mapping';

interface TrendSectionProps {
    trend: DecisionTrend;
    history: any[]; // Raw weekly data
}

// Reusing CustomTooltip logic from DemoDashboard but isolated here
function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
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

export default function TrendSection({ trend, history }: TrendSectionProps) {
    // Transform History
    const chartData = history.map(w => ({
        date: new Date(w.week_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        raw_strain: w.indices?.strain || 0,
        raw_withdrawal: w.indices?.withdrawal || 0,
        raw_trust: w.indices?.trust_gap || 0,
        strain_norm: normalizeToStability('strain', w.indices?.strain),
        withdrawal_norm: normalizeToStability('withdrawal', w.indices?.withdrawal),
        trust_norm: normalizeToStability('trust_gap', w.indices?.trust_gap)
    }));

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-100">Stability Trend</h3>
                    <p className="text-sm text-slate-400">{trend.explanation}</p>
                </div>
                <div className={`px-3 py-1 rounded text-xs font-bold uppercase border ${trend.direction === 'IMPROVING' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                        trend.direction === 'DETERIORATING' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
                            'text-blue-400 border-blue-500/30 bg-blue-500/10'
                    }`}>
                    {trend.direction}
                </div>
            </div>

            <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
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
                            width={30}
                            tickFormatter={(v) => v === 0 ? 'Crit' : v === 100 ? 'Opt' : ''}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="strain_norm" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="withdrawal_norm" stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="trust_norm" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 flex gap-4 justify-center text-[10px] text-slate-500 font-mono uppercase">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Strain</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f43f5e]" /> Withdrawal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Trust</span>
            </div>
        </div>
    );
}

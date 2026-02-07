'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label, color }: any) => {
    if (active && payload && payload.length) {
        const mainPayload = payload.find((p: any) => p.name === 'Main Value');
        const ciPayload = payload.find((p: any) => p.name === 'Confidence Interval');
        // Retrieve original data object
        const data = payload[0].payload;

        if (!mainPayload) return null;

        const value = mainPayload.value;
        const [low, high] = ciPayload ? ciPayload.value : [value - data.confidence, value + data.confidence];

        return (
            <div className="bg-[#050505]/95 border border-white/20 rounded-lg p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl min-w-[220px]">
                <p className="text-[10px] font-mono font-bold text-text-tertiary uppercase tracking-widest mb-3">
                    Week of {format(new Date(data.fullDate), 'MMM d, yyyy')}
                </p>

                <div className="space-y-4">
                    {/* Main Score */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-text-secondary">Index Score</span>
                        </div>
                        <span className={cn("text-3xl font-display font-semibold tracking-tight", `text-${color}`)}>
                            {value.toFixed(0)}
                        </span>
                    </div>

                    {/* Separator */}
                    <div className="h-px bg-white/10 w-full" />

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Signal Conf.</p>
                            <div className="flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", data.confidence > 2.5 ? 'bg-engagement shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-withdrawal')} />
                                <span className="text-sm font-medium text-white">{data.confidence > 2.5 ? 'High' : 'Med'}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">95% CI</p>
                            <span className="text-sm font-mono text-text-secondary">
                                {low.toFixed(0)} - {high.toFixed(0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

interface EngagementIndexGraphProps {
    metric?: 'strain' | 'withdrawal' | 'trust-gap' | 'engagement';
    data: any[];
}

const ThresholdLine = ({ y, label, color }: { y: number, label: string, color: string }) => (
    <ReferenceLine
        y={y}
        stroke={color}
        strokeDasharray="3 3"
        strokeOpacity={0.5}
        label={{
            position: 'insideTopRight',
            value: label,
            fill: color,
            fontSize: 10,
            fontFamily: 'Roboto Mono',
            opacity: 0.9,
            dy: -10
        }}
    />
);

export function EngagementIndexGraph({ metric = 'engagement', data = [] }: EngagementIndexGraphProps) {
    const dataKey = metric === 'trust-gap' ? 'trust' : metric;
    const rangeKey = `${dataKey}Range`;

    return (
        <div className="w-full h-[350px] rounded-xl border border-white/10 bg-[#050505] p-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-display font-medium text-white capitalize">
                        {metric.replace('-', ' ')} <span className="text-text-tertiary">Index</span>
                    </h3>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`gradient-main-${metric}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={`var(--color-${metric})`} stopOpacity={0.6} />
                            <stop offset="95%" stopColor={`var(--color-${metric})`} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id={`gradient-ci-${metric}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={`var(--color-${metric})`} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={`var(--color-${metric})`} stopOpacity={0.1} />
                        </linearGradient>
                    </defs>

                    <XAxis
                        dataKey="fullDate"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(date) => format(new Date(date), 'd MMM yy')}
                        tick={{ fill: '#52525B', fontSize: 10, fontFamily: 'Roboto Mono' }}
                        dy={10}
                    />
                    <YAxis
                        hide
                        domain={[0, 100]}
                    />
                    <Tooltip
                        content={<CustomTooltip color={metric} />}
                        cursor={{ stroke: '#52525B', strokeWidth: 1, strokeDasharray: '4 4' }}
                        wrapperStyle={{ zIndex: 100, outline: 'none' }}
                    />

                    {/* Threshold Lines */}
                    {metric === 'engagement' ? (
                        <>
                            <ThresholdLine y={75} label="Healthy" color="#10B981" />
                            <ThresholdLine y={50} label="Risk" color="#F59E0B" />
                            <ThresholdLine y={25} label="Critical" color="#E11D48" />
                        </>
                    ) : (
                        <>
                            <ThresholdLine y={25} label="Healthy" color="#10B981" />
                            <ThresholdLine y={50} label="Risk" color="#F59E0B" />
                            <ThresholdLine y={75} label="Critical" color="#E11D48" />
                        </>
                    )}

                    {/* Confidence Band - Rendered First to be behind */}
                    <Area
                        type="monotone"
                        dataKey={rangeKey}
                        name="Confidence Interval"
                        stroke="none"
                        fill={`url(#gradient-ci-${metric})`}
                        animationDuration={1000}
                    />

                    {/* Main Trend Line */}
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        name="Main Value"
                        stroke={`var(--color-${metric})`}
                        strokeWidth={2}
                        fill={`url(#gradient-main-${metric})`}
                        animationDuration={1000}
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

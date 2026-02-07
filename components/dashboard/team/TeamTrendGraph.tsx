'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TeamTrendGraphProps {
    data: any[];
    teamName: string;
}

export function TeamTrendGraph({ data, teamName }: TeamTrendGraphProps) {
    // Screenshot 4: "STRAIN INDEX TREND OF TEAM"
    // Red Graph.

    return (
        <div className="w-full h-[350px] p-6 rounded-xl border border-border bg-bg-surface/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-medium text-text-primary">
                    <span className="text-strain max-w-sm">STRAIN INDEX</span> <span className="text-text-tertiary">TREND OF TEAM</span>
                </h3>
            </div>

            <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorStrain" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-strain)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--color-strain)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" strokeOpacity={0.3} />
                        <XAxis
                            dataKey="week"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                            dy={10}
                        />
                        <YAxis
                            hide={true}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                            cursor={{ stroke: 'var(--text-tertiary)', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />

                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="var(--color-strain)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorStrain)"
                        />

                        {/* Threshold Line "Good" (actually low strain is good, so standard is upside down mentally? 
                 Screenshot shows curve going UP, "Good" label is at bottom? 
                 Actually Screenshot 4: "Good" label is at X axis level roughly. Curve is high.
                 Let's place "Good" line at 20 or 30.
            */}
                        <ReferenceLine y={30} stroke="var(--color-engagement)" strokeDasharray="3 3" strokeOpacity={0.5} label={{ position: 'left', value: 'Good', fill: 'var(--color-engagement)', fontSize: 12 }} />

                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

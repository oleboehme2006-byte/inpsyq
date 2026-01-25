"use client";

import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

// Mock data to match the "wave" in the screenshot
// Engagement usually 0-100.
const data = Array.from({ length: 9 }).map((_, i) => ({
    week: `W${i + 1}`,
    value: 60 + Math.sin(i * 0.5) * 5 + (i * 0.5), // Gentle wave upwards then down
    upper: 80 + Math.sin(i * 0.5) * 5,
    lower: 40 + Math.sin(i * 0.5) * 5,
}));

export function EngagementTrend() {
    return (
        <div className="w-full p-6 bg-[#0a0a0b] border border-white/5 rounded-2xl relative overflow-hidden">
            {/* Background Gradient Mesh (Subtle) */}
            <div className="absolute inset-0 bg-gradient-to-b from-engagement/5 to-transparent pointer-events-none" />

            <div className="flex items-center gap-2 mb-8">
                <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">
                    <span className="text-engagement font-bold">Engagement Index</span> Trend of Organization
                </h3>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="week"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                            dy={10}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-[#18181b] border border-[#27272a] p-3 rounded-lg shadow-xl">
                                            <p className="text-xs text-slate-400 font-mono mb-1">{payload[0].payload.week}</p>
                                            <p className="text-lg font-bold text-engagement">
                                                {payload[0].value?.toFixed(1)}%
                                            </p>
                                            <p className="text-xs text-slate-500">Confidence Spread: ±8%</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        {/* Uncertainty Band (simulated with 2 areas or just visual) 
                For the screenshot look, it's one smooth line with a fill.
            */}
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#22c55e"
                            strokeWidth={2}
                            fill="url(#colorValue)"
                        />
                        {/* Threshold Line for "Good" */}
                        <path d="M0 120 L1800 120" stroke="#22c55e" strokeOpacity={0.1} strokeDasharray="3 3" />
                        <text x="30" y="115" fill="#22c55e" fontSize="10" opacity="0.8">Good</text>

                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

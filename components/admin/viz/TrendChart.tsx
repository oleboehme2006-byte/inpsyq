'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Minimal SVG Trend Chart to avoid heavy charting libraries
// Expected data: Array of history items (Week Start, and Metric Value)

interface DataPoint {
    date: string;
    value: number; // 0-1
}

interface TrendChartProps {
    data: DataPoint[];
    label: string;
    color: string; // hex or tailwind class for stroke
}

export default function TrendChart({ data, label, color }: TrendChartProps) {
    if (data.length < 2) return <div className="text-xs text-slate-600">Collecting trend data...</div>;

    const width = 100;
    const height = 40;
    const padding = 2;

    const minVal = 0;
    const maxVal = 1;

    // Normalize points
    const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((d.value - minVal) / (maxVal - minVal)) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-[10px] uppercase text-slate-500 font-semibold">{label}</span>
                <span className="text-[10px] font-mono text-slate-400">4-Week Trend</span>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12 overflow-visible">
                {/* Baseline */}
                <line x1="0" y1={height} x2={width} y2={height} stroke="#334155" strokeWidth="0.5" />

                {/* Trend Line */}
                <motion.polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={color}
                    points={points}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                {/* End Dot */}
                {data.length > 0 && (() => {
                    const lastPt = points.split(' ').pop();
                    if (!lastPt) return null;
                    const [lx, ly] = lastPt.split(',');
                    return (
                        <circle cx={lx} cy={ly} r="2" className="fill-white" />
                    );
                })()}
            </svg>
        </div>
    );
}

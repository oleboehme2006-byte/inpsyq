'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getZone, MetricDefinition, PROFILE_METRICS } from '@/lib/visualization/mapping';
import { Info } from 'lucide-react';

interface MetricGaugeProps {
    metricId: string;
    value: number; // 0-1
}

export default function MetricGauge({ metricId, value }: MetricGaugeProps) {
    const def = PROFILE_METRICS[metricId];
    if (!def) return null;

    const zone = getZone(metricId, value);
    const percentage = Math.round(value * 100);

    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors group">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-slate-200">{def.label}</h4>
                    <div className="group/tooltip relative">
                        <Info className="w-3 h-3 text-slate-500 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-xs text-slate-300 p-2 rounded shadow-xl border border-slate-700 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                            {def.description}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-xl font-bold font-mono ${zone.color}`}>{percentage}%</span>
                </div>
            </div>

            {/* Semantic Zone Label */}
            <div className={`text-xs font-medium mb-3 ${zone.color} tracking-wide uppercase opacity-90`}>
                {zone.label}
            </div>

            {/* Progress Track */}
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative">
                {/* Zone Markers (Optional visuals for thresholds) */}
                <div className="absolute top-0 bottom-0 left-[30%] w-px bg-slate-900/30 z-10" />
                <div className="absolute top-0 bottom-0 left-[60%] w-px bg-slate-900/30 z-10" />

                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full relative overflow-hidden ${zone.color.replace('text-', 'bg-')}`}
                >
                    <div className="absolute inset-0 bg-white/20" />
                </motion.div>
            </div>

            <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
                <span>Low</span>
                <span>Critical Threshold</span>
                <span>High</span>
            </div>
        </div>
    );
}

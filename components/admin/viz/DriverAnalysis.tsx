'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DRIVER_DESCRIPTIONS } from '@/lib/visualization/mapping';

interface DriverAnalysisProps {
    contributions: Record<string, number>;
}

export default function DriverAnalysis({ contributions }: DriverAnalysisProps) {
    // Sort drivers by descending impact
    const drivers = Object.entries(contributions)
        .map(([key, value]) => ({
            key,
            value,
            label: key.replace(/_/g, ' '),
            description: DRIVER_DESCRIPTIONS[key] || 'Psychological parameter contributing to current state.'
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

    if (drivers.length === 0) {
        return <div className="text-sm text-slate-500 italic p-4">No significant drivers detected for this period.</div>;
    }

    const maxVal = Math.max(...drivers.map(d => d.value));

    return (
        <div className="space-y-4">
            {drivers.map((driver, index) => (
                <div key={driver.key} className="relative group">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200 uppercase tracking-wider">{driver.label}</span>
                            <span className="hidden group-hover:inline text-slate-500">- {driver.description}</span>
                        </div>
                        <span className="font-mono text-purple-300">{(driver.value * 100).toFixed(1)}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-slate-800/50 rounded-sm overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(driver.value / maxVal) * 100}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                className="h-full bg-gradient-to-r from-purple-900 to-purple-500 opacity-80"
                            />
                        </div>
                    </div>
                </div>
            ))}
            <div className="pt-2 border-t border-slate-800 mt-4 text-[10px] text-slate-500">
                * Relative contribution strength normalized against latent state baseline.
            </div>
        </div>
    );
}

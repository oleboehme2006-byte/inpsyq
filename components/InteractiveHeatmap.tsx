"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function InteractiveHeatmap() {
    // Synthetic data for the heatmap (7 days x 5 categories)
    const data = [
        { label: "Anxiety", values: [20, 35, 45, 60, 55, 40, 30] },
        { label: "Trust", values: [40, 45, 50, 55, 65, 70, 75] },
        { label: "Anger", values: [15, 20, 25, 65, 45, 20, 15] },
        { label: "Hope", values: [30, 35, 40, 35, 40, 50, 60] },
        { label: "Joy", values: [10, 15, 20, 25, 30, 35, 40] },
    ];

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Helper to map value to color intensity
    const getColor = (val: number) => {
        // Using accent-primary (indigo/violet) range
        return `rgba(99, 102, 241, ${val / 100})`;
    };

    return (
        <div className="p-4 bg-surface-dark border border-white/5 rounded-lg overflow-x-auto">
            <div className="min-w-[400px]">
                {/* Header row */}
                <div className="flex mb-2">
                    <div className="w-20 shrink-0"></div>
                    {days.map(d => (
                        <div key={d} className="flex-1 text-center text-xs text-text-muted">{d}</div>
                    ))}
                </div>

                {/* Data rows */}
                <div className="space-y-2">
                    {data.map((row, i) => (
                        <div key={row.label} className="flex items-center">
                            <div className="w-20 shrink-0 text-sm text-gray-400 font-medium">{row.label}</div>
                            {row.values.map((val, j) => (
                                <div key={j} className="flex-1 px-1 h-8 relative group">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 + j * 0.05 }}
                                        className="w-full h-full rounded cursor-default transition-all duration-300 hover:shadow-[0_0_10px_rgba(99,102,241,0.5)] hover:scale-105 hover:z-10"
                                        style={{ backgroundColor: getColor(val) }}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex justify-between items-center text-xs text-text-muted">
                    <span>Low Intensity</span>
                    <div className="w-32 h-2 rounded-full bg-gradient-to-r from-accent-primary/10 to-accent-primary"></div>
                    <span>High Intensity</span>
                </div>
            </div>
        </div>
    );
}

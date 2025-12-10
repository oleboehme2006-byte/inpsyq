"use client";

import { motion } from "framer-motion";

export function DriverPanel() {
    const drivers = [
        { label: "Security / Control", level: 85, color: "bg-emerald-500" },
        { label: "Status / Recognition", level: 60, color: "bg-amber-500" },
        { label: "Belonging / Identity", level: 45, color: "bg-blue-500" },
        { label: "Meaning / Purpose", level: 30, color: "bg-purple-500" },
    ];

    return (
        <div className="bg-surface-dark border border-white/5 rounded-lg p-5">
            <h4 className="text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">Psychological Drivers <span className="opacity-50 ml-1">(Synthetic Demo)</span></h4>
            <div className="space-y-4">
                {drivers.map((d, i) => (
                    <div key={i}>
                        <div className="flex justify-between text-xs mb-1 text-gray-300">
                            <span>{d.label}</span>
                            <span>{d.level}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${d.level}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className={`h-full ${d.color}`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function NarrativeAxesPanel() {
    return (
        <div className="bg-surface-dark border border-white/5 rounded-lg p-5 flex flex-col justify-center">
            <h4 className="text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">Narrative Axes</h4>
            <div className="space-y-6">
                {/* Axis 1 */}
                <div className="relative">
                    <div className="flex justify-between text-[10px] uppercase text-text-muted mb-1 font-bold">
                        <span>Fear</span>
                        <span>Trust</span>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-red-500/50 to-emerald-500/50 rounded-full relative">
                        <motion.div
                            initial={{ left: "50%" }}
                            whileInView={{ left: "75%" }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        />
                    </div>
                </div>
                {/* Axis 2 */}
                <div className="relative">
                    <div className="flex justify-between text-[10px] uppercase text-text-muted mb-1 font-bold">
                        <span>Conflict</span>
                        <span>Cooperation</span>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-orange-500/50 to-blue-500/50 rounded-full relative">
                        <motion.div
                            initial={{ left: "50%" }}
                            whileInView={{ left: "40%" }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TemporalDynamicsPanel() {
    return (
        <div className="bg-surface-dark border border-white/5 rounded-lg p-5 col-span-1 md:col-span-2">
            <h4 className="text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">Temporal Dynamics <span className="opacity-50 ml-1">(Trend Simulation)</span></h4>
            <div className="flex items-end justify-between h-24 gap-1 relative">
                {/* Trend line visual approximation using bars for simplicity/robustness without SVG chart lib */}
                {[30, 35, 40, 80, 75, 60, 45, 40, 35, 30, 25, 20].map((h, i) => (
                    <motion.div
                        key={i}
                        initial={{ height: "10%" }}
                        whileInView={{ height: `${h}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className={`flex-1 rounded-sm ${i === 3 ? 'bg-red-500 animate-pulse' : 'bg-accent-primary/30'} `}
                    />
                ))}

                {/* Labels */}
                <div className="absolute top-0 left-1/4 -translate-y-full text-[10px] bg-red-500/10 border border-red-500/30 text-red-200 px-2 py-1 rounded">
                    Policy Announcement
                </div>
            </div>
            <div className="text-xs text-text-muted mt-2 text-center">
                Example: Anxiety spike stabilization over 12h window
            </div>
        </div>
    )
}

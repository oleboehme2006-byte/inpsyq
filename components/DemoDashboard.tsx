"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Users, Calendar, BarChart2, Info, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

// --- Types ---
type Theme = "Engineering" | "Sales";
type Week = 0 | 1 | 2 | 3;

interface WeekData {
    strain: { value: number; delta: number; trend: "up" | "down" | "flat" };
    withdrawal: { value: number; delta: number; trend: "up" | "down" | "flat" };
    trustGap: { value: number; delta: number; trend: "up" | "down" | "flat" };
    drivers: { label: string; value: number }[]; // Top 3 drivers
    profileDistribution: { ouc: number; wrp: number; tfp: number }; // Outcome, Work Process, Team Friction
    heatmap: number[]; // 10 values for the 10 parameters
}

// --- Data ---
const TEAMS: Theme[] = ["Engineering", "Sales"];
const PARAMETERS = [
    "Perceived Control", "Psychological Safety", "Meaning", "Emotional Load", "Cognitive Dissonance",
    "Trust in Leadership", "Trust among Peers", "Autonomy Friction", "Engagement", "Adaptive Capacity"
];

// Deterministic Mock Data Generator
const generateData = (team: Theme): WeekData[] => {
    const isEng = team === "Engineering";
    // Eng: High strain, low trust initially, improving.
    // Sales: High energy, high withdrawal risk (burnout), volatile.

    return [0, 1, 2, 3].map(w => {
        const factor = isEng ? 1 - (w * 0.1) : 1 + (w * 0.05); // Trend

        return {
            strain: {
                value: Number((isEng ? 7.2 * factor : 5.5 * factor).toFixed(1)),
                delta: isEng ? -0.2 : 0.4,
                trend: isEng ? "down" : "up"
            },
            withdrawal: {
                value: Number((isEng ? 3.5 * factor : 6.2 * factor).toFixed(1)),
                delta: 0.1,
                trend: "flat"
            },
            trustGap: {
                value: Number((isEng ? 4.8 * factor : 2.1 * factor).toFixed(1)),
                delta: isEng ? -0.5 : 0.1,
                trend: isEng ? "down" : "flat"
            },
            drivers: isEng
                ? [
                    { label: "Autonomy Friction", value: 85 - w * 5 },
                    { label: "Cognitive Dissonance", value: 65 - w * 2 },
                    { label: "Trust in Leadership", value: 45 + w * 5 }
                ]
                : [
                    { label: "Emotional Load", value: 70 + w * 5 },
                    { label: "Meaning", value: 60 - w * 2 },
                    { label: "Perceived Control", value: 40 - w * 3 }
                ],
            profileDistribution: isEng
                ? { ouc: 20, wrp: 50, tfp: 30 }
                : { ouc: 60, wrp: 20, tfp: 20 },
            heatmap: PARAMETERS.map((_, i) => {
                // Generate deterministic "random" values based on week/team/index
                let val = ((i + 1) * 10 + w * 5 + (isEng ? 20 : 0)) % 100;
                if (isEng && (i === 4 || i === 7)) val += 30; // High friction/dissonance for Eng
                if (!isEng && (i === 3)) val += 40; // High emotional load for Sales
                return Math.min(100, Math.max(10, val));
            })
        };
    });
};

const DATA: Record<Theme, WeekData[]> = {
    "Engineering": generateData("Engineering"),
    "Sales": generateData("Sales")
};

export default function DemoDashboard() {
    const [team, setTeam] = useState<Theme>("Engineering");
    const [week, setWeek] = useState<Week>(3); // Default to latest week

    const currentData = DATA[team][week];

    return (
        <div className="bg-surface-dark border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {/* Header Controls */}
            <div className="bg-surface-card border-b border-white/5 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center space-x-4">
                    <div className="flex bg-surface-dark rounded-lg p-1 border border-white/5">
                        {TEAMS.map(t => (
                            <button
                                key={t}
                                onClick={() => setTeam(t)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${team === t ? 'bg-accent-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <span className="text-text-muted text-sm">Analysis Mode</span>
                </div>

                <div className="flex items-center space-x-2 bg-surface-dark rounded-lg p-1 border border-white/5">
                    {[0, 1, 2, 3].map((w) => (
                        <button
                            key={w}
                            onClick={() => setWeek(w as Week)}
                            className={`w-10 h-8 rounded-md text-xs font-mono transition-all ${week === w ? 'bg-white/10 text-white font-bold border border-white/20' : 'text-text-muted hover:text-white'}`}
                        >
                            W{w + 1}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="p-6 grid grid-cols-12 gap-6">

                {/* Top Row: Index Cards (col-span-12) */}
                <div className="col-span-12 grid md:grid-cols-3 gap-6">
                    <IndexCard title="Strain Index" data={currentData.strain} color="text-orange-400" />
                    <IndexCard title="Withdrawal Risk" data={currentData.withdrawal} color="text-red-400" />
                    <IndexCard title="Trust Gap" data={currentData.trustGap} color="text-indigo-400" />
                </div>

                {/* Left Column: Driver Breakdown (col-span-12 md:col-span-4) */}
                <div className="col-span-12 md:col-span-4 bg-surface-card rounded-lg border border-white/5 p-5">
                    <h4 className="text-xs font-semibold text-text-muted mb-6 uppercase tracking-wider flex items-center justify-between">
                        Top Drivers <Info className="w-3 h-3 cursor-help" />
                    </h4>
                    <div className="space-y-5">
                        <AnimatePresence mode="wait">
                            {currentData.drivers.map((d, i) => (
                                <motion.div
                                    key={`${team}-${week}-${d.label}`} // Force re-render on change
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                >
                                    <div className="flex justify-between text-xs mb-1.5 text-gray-300">
                                        <span>{d.label}</span>
                                        <span className="font-mono">{d.value}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${d.value}%` }}
                                            transition={{ duration: 0.8 }}
                                            className="h-full bg-accent-secondary"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Profile Weight Share */}
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <h4 className="text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">Contribution Profile</h4>
                        <div className="flex h-3 rounded-full overflow-hidden">
                            <motion.div animate={{ width: `${currentData.profileDistribution.ouc}%` }} className="bg-emerald-500/70" />
                            <motion.div animate={{ width: `${currentData.profileDistribution.wrp}%` }} className="bg-blue-500/70" />
                            <motion.div animate={{ width: `${currentData.profileDistribution.tfp}%` }} className="bg-purple-500/70" />
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-text-muted font-mono">
                            <span className="text-emerald-400">OUC</span>
                            <span className="text-blue-400">WRP</span>
                            <span className="text-purple-400">TFP</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Heatmap (col-span-12 md:col-span-8) */}
                <div className="col-span-12 md:col-span-8 bg-surface-card rounded-lg border border-white/5 p-5 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Latent State Heatmap</h4>
                        <div className="flex items-center space-x-2 text-[10px] text-text-muted">
                            <span>Low</span>
                            <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-accent-primary/10 to-accent-primary" />
                            <span>High</span>
                        </div>
                    </div>

                    <div className="relative">
                        {/* Headers */}
                        <div className="flex mb-2 pl-24 md:pl-32">
                            {[0, 1, 2, 3].map(w => (
                                <div key={w} className={`flex-1 text-center text-xs font-mono transition-colors ${w === week ? 'text-white font-bold' : 'text-text-muted opacity-50'}`}>W{w + 1}</div>
                            ))}
                        </div>

                        {/* Rows */}
                        <div className="space-y-1">
                            {PARAMETERS.map((param, pIdx) => (
                                <div key={param} className="flex items-center hover:bg-white/5 rounded transition-colors p-1">
                                    <div className="w-24 md:w-32 shrink-0 text-[10px] md:text-xs text-text-muted font-medium truncate">{param}</div>
                                    <div className="flex-1 flex gap-1">
                                        {[0, 1, 2, 3].map(w => {
                                            const val = DATA[team][w].heatmap[pIdx];
                                            const isActive = w === week;
                                            return (
                                                <div
                                                    key={w}
                                                    className={`flex-1 h-6 md:h-8 rounded-sm relative group transition-all duration-300 ${isActive ? 'ring-1 ring-white/50 z-10 scale-[1.02]' : 'opacity-70 grayscale-[0.5]'}`}
                                                    style={{ backgroundColor: `rgba(99, 102, 241, ${val / 100})` }}
                                                >
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-surface-dark border border-white/20 px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                                                        {isActive ? 'Current State' : `Week ${w + 1}`}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Overlay for interaction hint */}
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] rounded-lg" />
                </div>
            </div>
        </div>
    );
}

function IndexCard({ title, data, color }: { title: string, data: WeekData['strain'], color: string }) {
    return (
        <div className="bg-surface-card rounded-lg border border-white/5 p-5 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">{title}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${data.trend === 'up' ? 'border-red-500/20 text-red-400 bg-red-400/10' : data.trend === 'down' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-400/10' : 'border-gray-500/20 text-gray-400 bg-gray-400/10'}`}>
                    {data.trend === 'up' ? 'INC' : data.trend === 'down' ? 'DEC' : 'STABLE'}
                </span>
            </div>
            <div className="flex items-baseline space-x-2">
                <motion.span
                    key={data.value}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-3xl font-bold ${color}`}
                >
                    {data.value}
                </motion.span>
                <span className="text-xs text-text-muted">index</span>
            </div>

            {/* Trend Visual */}
            <div className="absolute bottom-0 left-0 right-0 h-1">
                <div className={`h-full ${data.trend === 'up' ? 'bg-red-500/50' : data.trend === 'down' ? 'bg-emerald-500/50' : 'bg-gray-500/50'}`} style={{ width: '100%' }} />
            </div>
        </div>
    )
}

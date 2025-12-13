"use client";

import FadeIn from "./ui/FadeIn";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function FeaturesSection() {
    const indices = [
        {
            title: "Strain Index",
            value: "7.2",
            delta: "+0.4",
            trend: "up",
            uncertainty: "low",
            drivers: ["Emotional Load", "Cognitive Dissonance"]
        },
        {
            title: "Withdrawal Risk",
            value: "3.5",
            delta: "-0.1",
            trend: "down",
            uncertainty: "med",
            drivers: ["Meaning", "Autonomy Friction"]
        },
        {
            title: "Trust Gap",
            value: "1.8",
            delta: "+0.1",
            trend: "flat",
            uncertainty: "high",
            drivers: ["Trust in Leadership", "Peer Trust"]
        }
    ];

    return (
        <section id="features" className="py-24">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Explainable organizational dynamics</h2>
                        <p className="text-xl text-text-muted max-w-xl">
                            Leaders do not see individuals.
                            They see structured psychological signals.
                        </p>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <div className="flex items-center text-sm text-accent-primary bg-accent-primary/10 px-4 py-2 rounded-lg border border-accent-primary/20">
                            <span className="mr-2">Every index is decomposable</span>
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </FadeIn>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {indices.map((index, idx) => (
                        <FadeIn key={idx} delay={idx * 0.1}>
                            <motion.div
                                className="group p-6 rounded-xl bg-surface-card border border-white/5 hover:border-accent-primary/30 transition-all hover:shadow-2xl relative overflow-hidden"
                                whileHover={{ y: -5 }}
                            >
                                {/* Background gradient on hover */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-dark/50 pointer-events-none" />

                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-white">{index.title}</h3>
                                    <div className={`flex items-center text-sm font-mono ${index.trend === 'up' ? 'text-red-400' : index.trend === 'down' ? 'text-emerald-400' : 'text-gray-400'}`}>
                                        {index.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : index.trend === 'down' ? <TrendingDown className="w-4 h-4 mr-1" /> : <Minus className="w-4 h-4 mr-1" />}
                                        {index.delta}
                                    </div>
                                </div>

                                <div className="flex items-baseline mb-6">
                                    <span className="text-5xl font-bold text-white tracking-tight">{index.value}</span>
                                    <span className="ml-2 text-xs text-text-muted uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded">
                                        σ: {index.uncertainty}
                                    </span>
                                </div>

                                {/* Drivers Section (Revealed/Highlighted on Hover) */}
                                <div className="border-t border-white/5 pt-4">
                                    <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Top Drivers</p>
                                    <div className="space-y-2">
                                        {index.drivers.map((driver, dIdx) => (
                                            <div key={dIdx} className="flex justify-between items-center text-sm text-gray-300">
                                                <span>{driver}</span>
                                                <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-accent-secondary"
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${((idx + dIdx + 1) * 37 % 60) + 20}%` }}
                                                        transition={{ delay: 0.5 + dIdx * 0.1 }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
}

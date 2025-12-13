"use client";

import FadeIn from "./ui/FadeIn";
import { ArrowRight, Lock, UserCheck, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function UseCasesSection() {
    return (
        <section id="use-cases" className="py-24 bg-surface-dark/30">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    {/* Text Content */}
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Private insight without exposure</h2>
                        <div className="space-y-6 text-lg text-text-muted leading-relaxed">
                            <p>
                                Employees receive private, non-comparative micro-insights.
                                <br />
                                <span className="text-white">No rankings. No peer comparison. No visibility for management.</span>
                            </p>
                            <p>
                                These insights are derived from the same latent model —
                                but scoped strictly to the individual.
                            </p>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-4">
                            {["No Individual Data Stored", "Local-First Encryption", "Aggregated Output Only"].map((tag, i) => (
                                <div key={i} className="px-3 py-1 rounded-full border border-white/5 bg-white/5 text-xs text-text-muted">
                                    {tag}
                                </div>
                            ))}
                        </div>
                    </FadeIn>

                    {/* Mock Component: Personal Dashboard */}
                    <FadeIn delay={0.2} className="relative">
                        {/* Card visual */}
                        <div className="relative z-10 bg-surface-card border border-white/5 rounded-2xl p-6 shadow-2xl max-w-sm mx-auto">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                                <div className="flex items-center text-sm font-medium text-white">
                                    <UserCheck className="w-4 h-4 mr-2 text-accent-secondary" />
                                    Your Weekly Reflection
                                </div>
                                <span className="text-xs text-text-muted">Just now</span>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                                    <p className="text-sm text-gray-300 leading-relaxed mb-2">
                                        This week, <span className="text-white font-semibold">emotional load</span> increased while <span className="text-white font-semibold">perceived control</span> decreased.
                                    </p>

                                    {/* Mini sparkline visualization */}
                                    <div className="h-8 flex items-end space-x-1 opacity-50 my-2">
                                        {[20, 30, 25, 40, 60].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                className={`flex-1 rounded-t-sm ${i === 4 ? 'bg-red-400' : 'bg-gray-600'}`}
                                                initial={{ height: 0 }}
                                                whileInView={{ height: `${h}%` }}
                                                transition={{ delay: 0.5 + i * 0.1 }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-1 h-full min-h-[40px] bg-accent-primary rounded-full mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-accent-primary font-bold uppercase tracking-wider mb-1">Suggested Focus</p>
                                        <p className="text-sm text-gray-300">Clarify task boundaries with your lead.</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-1 h-full min-h-[40px] bg-accent-secondary rounded-full mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-accent-secondary font-bold uppercase tracking-wider mb-1">Small Experiment</p>
                                        <p className="text-sm text-gray-300">Block one uninterrupted work session (90m).</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Back glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-accent-primary/5 blur-3xl rounded-full -z-10" />
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}

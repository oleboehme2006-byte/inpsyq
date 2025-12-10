"use client";

import FadeIn from "./ui/FadeIn";
import { motion } from "framer-motion";

export default function Hero() {
    return (
        <section id="hero" className="relative pt-32 pb-20 md:pt-48 md:pb-32 min-h-screen flex items-center">
            <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <div>
                    <FadeIn>
                        <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold tracking-wider text-accent-secondary uppercase bg-accent-secondary/10 rounded-full border border-accent-secondary/20">
                            Psychological Signal Extraction Engine
                        </span>
                    </FadeIn>

                    <div className="space-y-2 mb-6">
                        <FadeIn delay={0.1}>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                                Social Sentiment
                            </h1>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                Data-Driven Depth
                            </h1>
                        </FadeIn>
                        <FadeIn delay={0.3}>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-accent-primary leading-tight">
                                Psychological Insights
                            </h1>
                        </FadeIn>
                    </div>

                    <FadeIn delay={0.4}>
                        <p className="text-lg text-text-muted mb-8 max-w-lg leading-relaxed">
                            InPsyq reveals the sub-textual drivers of public conversation—extracting core narratives, emotional frames, and psychological clusters from large-scale data.
                        </p>
                    </FadeIn>

                    <FadeIn delay={0.5} className="flex flex-wrap gap-4">
                        <a href="#early-access" className="px-6 py-3 bg-accent-primary hover:bg-accent-primary/90 text-white font-medium rounded-lg transition-all shadow-lg shadow-accent-primary/25">
                            Request Early Access
                        </a>
                        <a href="#sample-report" className="px-6 py-3 border border-white/20 hover:border-white/40 text-white font-medium rounded-lg transition-all bg-white/5 hover:bg-white/10">
                            View Sample Report
                        </a>
                    </FadeIn>
                </div>

                {/* Right Content - Mockup */}
                <div className="relative">
                    <motion.div
                        initial={{ opacity: 0, x: 50, rotate: 5 }}
                        animate={{ opacity: 1, x: 0, rotate: 0 }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
                        className="relative z-10 bg-surface-card border border-white/10 rounded-xl p-6 shadow-2xl backdrop-blur-sm"
                    >
                        {/* Mockup Header */}
                        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-white">Conversation Snapshot</h3>
                                <p className="text-xs text-text-muted">Last 24 hours • Global</p>
                            </div>
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                <div className="w-2 h-2 rounded-full bg-green-500/50" />
                            </div>
                        </div>

                        {/* Mockup Content */}
                        <div className="space-y-4">
                            {/* Chart Placeholder */}
                            <div className="flex items-end space-x-2 h-24 mb-6 px-2">
                                {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ duration: 0.8, delay: 1 + i * 0.05 }}
                                        className="flex-1 bg-accent-primary/40 rounded-t-sm relative group"
                                    >
                                        <div className="absolute inset-x-0 bottom-0 top-0 bg-accent-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Insights List */}
                            <ul className="space-y-3">
                                {[
                                    { text: "Rising concern around pricing narratives", color: "bg-orange-500" },
                                    { text: "Trust-framed messages outperform fear", color: "bg-emerald-500" },
                                    { text: "Anger spikes mapped to policy announcements", color: "bg-red-500" }
                                ].map((item, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.5 + i * 0.2 }}
                                        className="flex items-center text-sm text-gray-300 p-3 bg-white/5 rounded-lg border border-white/5"
                                    >
                                        <span className={`w-2 h-2 rounded-full ${item.color} mr-3 shrink-0`} />
                                        {item.text}
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>

                    {/* Decorative elements behind card */}
                    <div className="absolute -inset-4 bg-gradient-to-tr from-accent-primary/20 to-accent-secondary/20 rounded-xl blur-2xl -z-10" />
                </div>
            </div>
        </section>
    );
}

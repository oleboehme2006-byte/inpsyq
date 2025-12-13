"use client";

import FadeIn from "./ui/FadeIn";

import { motion } from "framer-motion";

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-surface-dark relative overflow-hidden">
            {/* Background decorative line */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent hidden md:block" />

            <div className="container mx-auto px-6 relative z-10">
                <FadeIn className="text-center mb-20">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">From interaction to inference</h2>
                </FadeIn>

                <div className="grid md:grid-cols-3 gap-8">

                    {/* Step 1: Interactions */}
                    <FadeIn delay={0.1} className="relative group">
                        <div className="bg-surface-card p-6 rounded-xl border border-white/5 h-full flex flex-col">
                            <h3 className="text-xl font-bold mb-4 text-white">Interactions</h3>
                            <p className="text-text-muted text-sm leading-relaxed mb-6">
                                Employees interact with the system through short, varied prompts.
                                No fixed questionnaires. No repetitive scales. Each interaction captures context-sensitive signals.
                            </p>

                            {/* Graphic: Funnel */}
                            <div className="mt-auto h-32 relative flex items-center justify-center overflow-hidden bg-white/5 rounded-lg border border-white/5">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-8 h-10 bg-white/10 rounded border border-white/20"
                                        initial={{ y: -50, x: (i - 1) * 30, opacity: 0 }}
                                        animate={{ y: 20, x: 0, opacity: [0, 1, 0] }}
                                        transition={{ duration: 2, delay: i * 0.6, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                ))}
                                {/* Funnel Shape */}
                                <svg className="absolute inset-0 w-full h-full text-accent-primary/20" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path d="M20,0 L40,100 L60,100 L80,0" fill="currentColor" />
                                </svg>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Step 2: Bayesian Update */}
                    <FadeIn delay={0.2} className="relative group">
                        <div className="bg-surface-card p-6 rounded-xl border border-white/5 h-full flex flex-col">
                            <h3 className="text-xl font-bold mb-4 text-white">Bayesian Update</h3>
                            <p className="text-text-muted text-sm leading-relaxed mb-6">
                                Each interaction updates latent states using Bayesian inference.
                                Prior beliefs are adjusted. Uncertainty is reduced or increased. No single answer dominates the model.
                            </p>

                            {/* Graphic: Prior -> Posterior */}
                            <div className="mt-auto h-32 relative flex items-end justify-center px-4 bg-white/5 rounded-lg border border-white/5">
                                <svg className="w-full h-full" viewBox="0 0 100 50">
                                    {/* Prior */}
                                    <path d="M10,45 Q50,0 90,45" fill="none" stroke="gray" strokeWidth="1" strokeDasharray="2,2" />
                                    {/* Posterior (Animated) */}
                                    <motion.path
                                        d="M30,45 Q50,-10 70,45"
                                        fill="none"
                                        stroke="var(--accent-primary)" // accent-primary
                                        strokeWidth="2"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                    />
                                    {/* Observation Line */}
                                    <motion.line
                                        x1="50" y1="45" x2="50" y2="10"
                                        stroke="white"
                                        strokeWidth="1"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                    />
                                </svg>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Step 3: Aggregation & Explainability */}
                    <FadeIn delay={0.3} className="relative group">
                        <div className="bg-surface-card p-6 rounded-xl border border-white/5 h-full flex flex-col">
                            <h3 className="text-xl font-bold mb-4 text-white">Aggregation & Explainability</h3>
                            <p className="text-text-muted text-sm leading-relaxed mb-6">
                                Individual states are aggregated strictly at team and organization level.
                                Indices are computed from weighted parameter relationships. Every result is decomposable into drivers.
                            </p>

                            {/* Graphic: Nodes Merging */}
                            <div className="mt-auto h-32 relative flex items-center justify-center bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2 h-2 rounded-full bg-accent-secondary"
                                        initial={{
                                            x: Math.sin(i + 1) * 40,
                                            y: Math.cos(i + 1) * 30,
                                            scale: 1
                                        }}
                                        animate={{
                                            x: 0,
                                            y: 0,
                                            scale: 0
                                        }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                ))}
                                <div className="z-10 w-8 h-8 rounded-full border-2 border-accent-primary flex items-center justify-center bg-surface-dark">
                                    <div className="w-2 h-2 bg-accent-primary rounded-full" />
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                </div>
            </div>
        </section>
    );
}

"use client";

import FadeIn from "./ui/FadeIn";
import { Heart, Database, Brain } from "lucide-react";
import { motion } from "framer-motion";

export default function SolutionSection() {
    const parameters = [
        "Perceived Control",
        "Psychological Safety",
        "Meaning",
        "Emotional Load",
        "Cognitive Dissonance",
        "Trust in Leadership",
        "Trust among Peers",
        "Autonomy Friction",
        "Engagement",
        "Adaptive Capacity"
    ];

    return (
        <section id="solution" className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-dark/50 pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-16">
                    {/* Text Side */}
                    <div>
                        <FadeIn>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                                A latent-state model of organizational psychology
                            </h2>
                            <div className="space-y-6 text-lg text-text-muted">
                                <p>
                                    InPsyq does not measure opinions.
                                    It infers <span className="text-white font-semibold">latent psychological states</span> from repeated micro-interactions.
                                </p>
                                <p>
                                    These states are probabilistic.
                                    Each has a mean estimate and an explicit uncertainty.
                                </p>
                            </div>

                            <div className="mt-12 p-6 bg-accent-primary/5 border border-accent-primary/10 rounded-lg">
                                <p className="text-sm text-accent-primary font-mono leading-relaxed">
                                    <span className="font-bold">NOTE:</span> These are not survey scores.
                                    They are continuously updated latent variables inferred over time.
                                </p>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Graphic Side: 10-Dimensional State Vector */}
                    <div className="relative">
                        <FadeIn delay={0.2} className="bg-surface-card/30 border border-white/5 rounded-xl p-8 backdrop-blur-sm">
                            <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-6">Current State Vector (t_now)</h3>

                            <div className="space-y-4">
                                {parameters.map((param, i) => (
                                    <div key={i} className="group">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-300 font-medium">{param}</span>
                                            <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                                σ: {((i * 0.17 % 0.5) + 0.1).toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Bar Container */}
                                        <div className="h-4 bg-white/5 rounded-sm relative overflow-hidden">
                                            {/* Uncertainty Band */}
                                            <motion.div
                                                className="absolute top-0 bottom-0 bg-accent-primary/20"
                                                initial={{ left: "20%", right: "20%" }}
                                                animate={{
                                                    left: `${20 + (i * 7 % 10)}%`,
                                                    right: `${20 + (i * 9 % 10)}%`
                                                }}
                                                transition={{ duration: 2 + (i % 3), repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: i * 0.1 }}
                                            />

                                            {/* Mean Value Marker */}
                                            <motion.div
                                                className="absolute top-0 bottom-0 w-1 bg-accent-primary rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                                initial={{ left: "50%" }}
                                                animate={{ left: `${50 + ((i * 13 % 40) - 20)}%` }}
                                                transition={{ duration: 4 + (i % 2), repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: i * 0.2 }}
                                            />

                                            {/* Probabilistic Noise Overlay */}
                                            <motion.div
                                                className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"
                                                animate={{ x: [-10, 0, -10] }}
                                                transition={{ duration: 0.2, repeat: Infinity }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </div>
        </section>
    );
}

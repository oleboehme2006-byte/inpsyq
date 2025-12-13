"use client";

import FadeIn from "./ui/FadeIn";
import { Layers, Unlock, Server } from "lucide-react";
import { motion } from "framer-motion";

export default function ExplainerSection() {
    return (
        <section className="py-24 bg-[#050509] relative overflow-hidden">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="grid md:grid-cols-2 gap-12 items-center">

                    {/* Text Content */}
                    <FadeIn>
                        <h2 className="text-3xl font-bold text-white mb-8">Depth without friction</h2>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                                    <span className="w-6 h-6 rounded-full bg-accent-primary/20 text-accent-primary flex items-center justify-center text-xs mr-3">1</span>
                                    Temporal Depth
                                </h3>
                                <p className="text-text-muted text-sm ml-9 leading-relaxed">
                                    Psychological states tracked as trajectories, not snapshots.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                                    <span className="w-6 h-6 rounded-full bg-accent-secondary/20 text-accent-secondary flex items-center justify-center text-xs mr-3">2</span>
                                    Explainability
                                </h3>
                                <p className="text-text-muted text-sm ml-9 leading-relaxed">
                                    Every signal decomposable into parameters and contributors.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                                    <span className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-xs mr-3">3</span>
                                    Psychological Grounding
                                </h3>
                                <p className="text-text-muted text-sm ml-9 leading-relaxed">
                                    Built on organizational psychology and statistical inference — not black-box scoring.
                                </p>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Graphic: Three interlocking structures */}
                    <FadeIn delay={0.2} className="relative h-[400px] flex items-center justify-center p-8 bg-surface-dark/50 rounded-xl border border-white/5">
                        <div className="relative w-64 h-64">
                            {/* Circle 1 */}
                            <motion.div
                                className="absolute top-0 left-0 w-40 h-40 border-2 border-accent-primary rounded-full mix-blend-screen bg-accent-primary/10"
                                animate={{ y: [0, 10, 0], x: [0, 10, 0], rotate: [0, 5, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            />
                            {/* Circle 2 */}
                            <motion.div
                                className="absolute top-0 right-0 w-40 h-40 border-2 border-accent-secondary rounded-full mix-blend-screen bg-accent-secondary/10"
                                animate={{ y: [0, 10, 0], x: [0, -10, 0], rotate: [0, -5, 0] }}
                                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            />
                            {/* Circle 3 */}
                            <motion.div
                                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-40 border-2 border-white rounded-full mix-blend-screen bg-white/5"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                            />

                            {/* Center Connection Highlight */}
                            <motion.div
                                className="absolute inset-0 bg-white blur-3xl opacity-0"
                                animate={{ opacity: [0, 0.1, 0] }}
                                transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                            />
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}

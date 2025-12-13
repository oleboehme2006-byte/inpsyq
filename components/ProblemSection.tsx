"use client";

import FadeIn from "./ui/FadeIn";
import { AlertCircle, EyeOff, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function ProblemSection() {
    return (
        <section id="problem" className="py-24 relative bg-surface-dark/50">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-12 items-center">

                    {/* Text Content */}
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">
                            Why most organizations misread their own dynamics
                        </h2>
                        <div className="space-y-6 text-lg text-text-muted leading-relaxed">
                            <p>
                                Organizations rarely fail because of missing talent or strategy.
                                They fail because <span className="text-white font-semibold">psychological strain, disengagement, and trust erosion</span> accumulate unnoticed.
                            </p>
                            <p>
                                Traditional tools capture opinions or performance.
                                They do not capture psychological dynamics unfolding over time.
                            </p>
                            <p className="text-white border-l-2 border-accent-primary pl-4">
                                What matters most is not how people answer once —
                                but how collective states evolve week by week.
                            </p>
                        </div>
                    </FadeIn>

                    {/* Graphic: Timeline Visualization */}
                    <FadeIn delay={0.2} className="relative h-[400px] w-full bg-surface-card/20 rounded-xl border border-white/5 p-8 overflow-hidden">

                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-dark/20" />

                        {/* Chart Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between py-8 px-8 opacity-10">
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <div key={i} className="w-full h-px bg-white" />
                            ))}
                        </div>

                        {/* Animated Curves */}
                        <svg className="absolute inset-0 w-full h-full" overflow="visible">
                            {/* Curve 1: Slow Drift (Strain?) */}
                            <motion.path
                                d="M0,300 C100,290 200,310 300,280 S500,200 600,150"
                                fill="none"
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth="2"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 3, ease: "easeInOut" }}
                            />
                            {/* Curve 2: Inflection Point (Trust?) */}
                            <motion.path
                                d="M0,150 C150,160 250,140 350,180 S500,300 600,320"
                                fill="none"
                                stroke="#A3A3A3"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 3, delay: 0.5, ease: "easeInOut" }}
                            />
                            {/* Curve 3: Main Dynamic (Accent) */}
                            <motion.path
                                d="M0,250 C100,240 200,260 300,220 S500,100 600,80"
                                fill="none"
                                stroke="var(--accent-primary)" // Using CSS variable or explicit color
                                className="text-accent-primary"
                                strokeWidth="3"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 4, delay: 1, ease: "easeInOut" }}
                            />

                            {/* Moving Point on Line 3 */}
                            <motion.circle
                                r="6"
                                fill="var(--accent-primary)"
                                className="text-accent-primary"
                                initial={{ offsetDistance: "0%" }}
                                animate={{ offsetDistance: "100%" }}
                                style={{ offsetPath: `path("M0,250 C100,240 200,260 300,220 S500,100 600,80")` }}
                                transition={{ duration: 4, delay: 1, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
                            />
                        </svg>

                        {/* Labels */}
                        <div className="absolute top-20 right-10 text-xs text-accent-primary font-mono bg-accent-primary/10 px-2 py-1 rounded">Shift Predicted</div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}

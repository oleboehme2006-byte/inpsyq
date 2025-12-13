"use client";

import FadeIn from "./ui/FadeIn";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Hero() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <section id="hero" className="relative pt-32 pb-20 md:pt-48 md:pb-32 min-h-screen flex items-center overflow-hidden">
            {/* Abstract Animated Field Background - Subtle underlying layer */}
            <div className="absolute inset-x-0 top-0 h-full overflow-hidden pointer-events-none opacity-30">
                {mounted && [...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-accent-primary/20 rounded-full blur-xl"
                        initial={{
                            x: Math.random() * 1000,
                            y: Math.random() * 800,
                            scale: Math.random() * 0.5 + 0.5,
                            opacity: Math.random() * 0.5
                        }}
                        animate={{
                            y: [null, Math.random() * 800],
                            x: [null, Math.random() * 1000],
                        }}
                        transition={{
                            duration: Math.random() * 20 + 20,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "linear"
                        }}
                        style={{
                            width: Math.random() * 300 + 50,
                            height: Math.random() * 300 + 50,
                        }}
                    />
                ))}
            </div>

            <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
                {/* Left Content */}
                <div>
                    <div className="space-y-1 mb-6">
                        <FadeIn delay={0.1}>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white/50 leading-tight">
                                Psychological Insights
                            </h1>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white/50 leading-tight">
                                Data-Driven Depth
                            </h1>
                        </FadeIn>
                        <FadeIn delay={0.3}>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                                Organizational Intelligence
                            </h1>
                        </FadeIn>
                    </div>

                    <FadeIn delay={0.4}>
                        <h2 className="text-xl text-white font-medium mb-4 max-w-lg leading-relaxed">
                            InPsyq models organizational psychology as a system of evolving latent states — measured continuously, aggregated safely, and explained transparently.
                        </h2>
                        <p className="text-md text-text-muted mb-8 max-w-lg leading-relaxed">
                            Weekly insights into psychological safety, trust gap, withdrawal risk, emotional load, cognitive dissonance, autonomy friction, engagement, meaning, leadership trust, adaptive capacity, strain index — and more.
                        </p>
                    </FadeIn>

                    <FadeIn delay={0.5} className="flex flex-wrap gap-4">
                        <a href="#how-it-works" className="px-6 py-3 bg-accent-primary hover:bg-accent-primary/90 text-white font-medium rounded-lg transition-all shadow-lg shadow-accent-primary/25">
                            Explore the system
                        </a>
                        <a href="#sample-report" className="px-6 py-3 border border-white/20 hover:border-white/40 text-white font-medium rounded-lg transition-all bg-white/5 hover:bg-white/10">
                            View a live analysis
                        </a>
                    </FadeIn>
                </div>

                {/* Right Content - Abstract Signal Field */}
                <div className="relative h-[400px] w-full flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent-primary/10 to-transparent rounded-full blur-3xl" />

                    {/* Signal Particles */}
                    <div className="relative w-full h-full">
                        {mounted && [...Array(30)].map((_, i) => (
                            <motion.div
                                key={i}
                                className={`absolute rounded-full ${(i % 3 === 0) ? 'bg-accent-primary' : (i % 3 === 1) ? 'bg-white' : 'bg-accent-secondary'}`}
                                initial={{
                                    opacity: 0,
                                    scale: 0,
                                    x: "50%",
                                    y: "50%"
                                }}
                                animate={{
                                    opacity: [0, 0.8, 0],
                                    scale: [0, Math.random() * 1.5 + 0.5, 0],
                                    x: `${Math.random() * 100}%`,
                                    y: `${Math.random() * 100}%`
                                }}
                                transition={{
                                    duration: Math.random() * 5 + 3,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                    ease: "easeInOut"
                                }}
                                style={{
                                    width: Math.random() * 6 + 2,
                                    height: Math.random() * 6 + 2,
                                }}
                            />
                        ))}

                        {/* Connection Lines (Simulated clusters) */}
                        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
                            <motion.path
                                d="M50,200 Q150,100 250,200 T450,200"
                                stroke="white"
                                strokeWidth="1"
                                fill="none"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                            />
                            <motion.path
                                d="M100,300 Q200,200 300,300 T500,300"
                                stroke="currentColor"
                                className="text-accent-primary"
                                strokeWidth="1"
                                fill="none"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1 }}
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    );
}

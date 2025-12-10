"use client";

import FadeIn from "./ui/FadeIn";
import { Heart, Database, Brain } from "lucide-react";

export default function SolutionSection() {
    const solutions = [
        {
            icon: <Heart className="w-10 h-10 text-accent-secondary" />,
            title: "Social Sentiment",
            text: "Go beyond binary sentiment with richer views on emotional tones, tensions and trends across platforms."
        },
        {
            icon: <Database className="w-10 h-10 text-accent-primary" />,
            title: "Data-Driven Depth",
            text: "Blend large-scale quantitative analysis with structured patterns and dynamics you can actually interpret."
        },
        {
            icon: <Brain className="w-10 h-10 text-white" />,
            title: "Psychological Insights",
            text: "Reveal emotional drivers, motives and frames behind public conversations—without profiling individuals."
        }
    ];

    return (
        <section id="solution" className="py-24 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-dark/50 pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <FadeIn className="mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">What InPsyq adds</h2>
                </FadeIn>

                <div className="grid md:grid-cols-3 gap-8">
                    {solutions.map((item, idx) => (
                        <FadeIn key={idx} delay={idx * 0.2}>
                            <div className="group relative p-8 rounded-2xl bg-white/5 border border-white/5 overflow-hidden hover:bg-white/10 transition-colors">
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-accent-primary to-accent-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                                <div className="mb-6 p-3 rounded-xl bg-surface-dark w-fit border border-white/10">
                                    {item.icon}
                                </div>

                                <h3 className="text-2xl font-bold mb-4 text-white">{item.title}</h3>
                                <p className="text-text-muted leading-relaxed">
                                    {item.text}
                                </p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
}

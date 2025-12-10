"use client";

import FadeIn from "./ui/FadeIn";
import { AlertCircle, EyeOff, BarChart2 } from "lucide-react";

export default function ProblemSection() {
    const problems = [
        {
            icon: <BarChart2 className="w-8 h-8 text-accent-primary" />,
            title: "Surface-level sentiment",
            text: "Most tools track positive vs. negative—but can’t show emotional nuance or complex shifts."
        },
        {
            icon: <EyeOff className="w-8 h-8 text-accent-primary" />,
            title: "No psychological context",
            text: "Important changes in public mood stay hidden without an understanding of motives, frames and narratives."
        },
        {
            icon: <AlertCircle className="w-8 h-8 text-accent-primary" />,
            title: "Hard to turn into decisions",
            text: "Raw dashboards rarely translate into clear communication and strategy choices."
        }
    ];

    return (
        <section id="problem" className="py-24 relative bg-surface-dark/50">
            <div className="container mx-auto px-6">
                <FadeIn className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Why traditional analytics fall short</h2>
                </FadeIn>

                <div className="grid md:grid-cols-3 gap-8">
                    {problems.map((problem, idx) => (
                        <FadeIn key={idx} delay={idx * 0.2}>
                            <div className="h-full p-8 rounded-xl bg-surface-card border border-white/5 hover:border-accent-primary/50 transition-all duration-300 hover:-translate-y-1 group">
                                <div className="mb-6 p-4 rounded-lg bg-surface-dark w-fit group-hover:bg-accent-primary/10 transition-colors">
                                    {problem.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-white group-hover:text-accent-primary transition-colors">
                                    {problem.title}
                                </h3>
                                <p className="text-text-muted leading-relaxed">
                                    {problem.text}
                                </p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
}

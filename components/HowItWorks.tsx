"use client";

import FadeIn from "./ui/FadeIn";

export default function HowItWorks() {
    const steps = [
        {
            step: "01",
            title: "Collect public conversations",
            text: "We focus on aggregated, GDPR-compliant public discourse around your topics, markets and audiences."
        },
        {
            step: "02",
            title: "Analyze with data & psych lenses",
            text: "Models detect emotional signals, drives, frames and narrative structures across thousands of posts."
        },
        {
            step: "03",
            title: "Deliver explainable insights",
            text: "You receive structured summaries and visual snapshots that show not only what is happening, but why."
        }
    ];

    return (
        <section id="how-it-works" className="py-24 bg-surface-dark relative overflow-hidden">
            {/* Visual connecting line */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent hidden md:block" />

            <div className="container mx-auto px-6 relative z-10">
                <FadeIn className="text-center mb-20">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">How it works</h2>
                </FadeIn>

                <div className="grid md:grid-cols-3 gap-12">
                    {steps.map((item, idx) => (
                        <FadeIn key={idx} delay={idx * 0.2}>
                            <div className="relative pt-8 md:pt-0">
                                <div className="md:absolute md:-top-6 md:left-1/2 md:-translate-x-1/2 w-12 h-12 rounded-full bg-surface-card border-4 border-surface-dark flex items-center justify-center text-sm font-bold text-accent-secondary z-10 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                                    {idx + 1}
                                </div>

                                <div className="bg-surface-card p-8 rounded-xl border border-white/5 text-center h-full hover:border-accent-secondary/30 transition-colors">
                                    <span className="md:hidden text-accent-secondary font-mono text-sm mb-4 block">{item.step}</span>
                                    <h3 className="text-xl font-bold mb-4 text-white">{item.title}</h3>
                                    <p className="text-text-muted text-sm leading-relaxed">
                                        {item.text}
                                    </p>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
}

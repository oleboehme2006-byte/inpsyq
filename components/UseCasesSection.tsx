"use client";

import FadeIn from "./ui/FadeIn";
import { ArrowRight } from "lucide-react";

export default function UseCasesSection() {
    const cases = [
        {
            role: "Agencies",
            text: "Build pitches and campaigns on top of real emotional and narrative insight—not guesswork."
        },
        {
            role: "Brand & Marketing Teams",
            text: "Monitor brand perception, topic sentiment and campaign resonance in a way that goes beyond vanity metrics."
        },
        {
            role: "Communications & PR",
            text: "Understand narrative shifts, risks and opportunities before they become front-page news."
        },
        {
            role: "Organizations & NGOs",
            text: "See what truly moves people around social issues and public debates."
        }
    ];

    return (
        <section id="use-cases" className="py-24 bg-surface-dark/30">
            <div className="container mx-auto px-6">
                <FadeIn className="mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Who InPsyQ is for</h2>
                    <div className="h-1 w-20 bg-accent-primary rounded-full" />
                </FadeIn>

                <div className="grid md:grid-cols-2 gap-6">
                    {cases.map((item, idx) => (
                        <FadeIn key={idx} delay={idx * 0.1}>
                            <div className="flex items-start p-6 rounded-xl border border-white/5 hover:border-accent-primary/30 transition-colors bg-surface-card">
                                <div className="mr-4 mt-1">
                                    <ArrowRight className="text-accent-primary w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">{item.role}</h3>
                                    <p className="text-text-muted">
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

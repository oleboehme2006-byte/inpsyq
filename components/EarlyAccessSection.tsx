"use client";

import FadeIn from "./ui/FadeIn";
import { ArrowRight } from "lucide-react";

export default function EarlyAccessSection() {
    return (
        <section id="early-access" className="py-32 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/20 via-surface-dark to-accent-secondary/10" />

            <div className="container mx-auto px-6 relative z-10 text-center">
                <FadeIn>
                    <div className="inline-block px-4 py-1.5 rounded-full border border-accent-secondary/30 bg-accent-secondary/10 text-accent-secondary text-sm font-medium mb-8">
                        Limited intake for Q1 2026
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
                        Join the early access program
                    </h2>

                    <p className="text-xl text-text-muted mb-12 max-w-2xl mx-auto">
                        We’re onboarding a small group of early adopters to refine InPsyQ with real use cases. Gain deep insight before the market catches up.
                    </p>

                    <div className="flex flex-col md:flex-row gap-8 justify-center mb-12 text-left max-w-2xl mx-auto">
                        {[
                            "Co-create features tailored to your needs",
                            "Gain early access to new analysis capabilities",
                            "Preferential pilot pricing for early adopters"
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center text-white font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary mr-3" />
                                {item}
                            </div>
                        ))}
                    </div>

                    <a
                        href="mailto:hello@inpsyq.ai?subject=Early%20Access%20Request"
                        className="inline-flex items-center px-8 py-4 bg-accent-primary hover:bg-accent-primary/90 text-white font-bold rounded-lg transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.5)] transform hover:-translate-y-1"
                    >
                        Request Early Access <ArrowRight className="ml-2 w-5 h-5" />
                    </a>
                </FadeIn>
            </div>
        </section>
    );
}

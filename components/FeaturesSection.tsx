"use client";

import FadeIn from "./ui/FadeIn";
import { MessageCircle, GitBranch, TrendingUp, FileText, Target, ShieldCheck } from "lucide-react";

export default function FeaturesSection() {
    const features = [
        {
            icon: <MessageCircle className="w-6 h-6" />,
            title: "Emotion & sentiment mapping",
            text: "Track emotional tones as they evolve around your topics."
        },
        {
            icon: <GitBranch className="w-6 h-6" />,
            title: "Narrative & frame detection",
            text: "See which stories, metaphors and frames dominate public discourse."
        },
        {
            icon: <TrendingUp className="w-6 h-6" />,
            title: "Trend & volatility tracking",
            text: "Spot emerging spikes, drops and inflection points before they turn into crises."
        },
        {
            icon: <FileText className="w-6 h-6" />,
            title: "Explainable insight summaries",
            text: "Readable, audit-friendly explanations instead of opaque scores or magic numbers."
        },
        {
            icon: <Target className="w-6 h-6" />,
            title: "Custom KPIs",
            text: "Define metrics that reflect your brand, campaigns or policy priorities."
        },
        {
            icon: <ShieldCheck className="w-6 h-6" />,
            title: "GDPR-safe discourse focus",
            text: "InPsyq analyzes public discourse, not individuals—keeping you compliant."
        }
    ];

    return (
        <section id="features" className="py-24">
            <div className="container mx-auto px-6">
                <FadeIn className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">What you get with InPsyq</h2>
                </FadeIn>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                        <FadeIn key={idx} delay={idx * 0.1}>
                            <div className="p-6 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all hover:scale-[1.02]">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 flex items-center justify-center text-accent-secondary mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
                                <p className="text-text-muted text-sm">
                                    {feature.text}
                                </p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
}

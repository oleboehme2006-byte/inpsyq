"use client";

import FadeIn from "./ui/FadeIn";
import DemoDashboard from "./DemoDashboard";

export default function SampleReportSection() {
    return (
        <section id="sample-report" className="py-24 relative overflow-hidden bg-[#050509]">
            <div className="container mx-auto px-6 text-center">
                <FadeIn className="max-w-4xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Interactive organizational analysis (demo)</h2>
                    <p className="text-text-muted text-lg leading-relaxed">
                        This is not synthetic "AI output". <br className="hidden md:block" />
                        It is a decomposed snapshot of a probabilistic psychological model.
                    </p>
                </FadeIn>

                <FadeIn delay={0.2} className="relative z-10 text-left">
                    <DemoDashboard />

                    {/* Back Glow Effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] bg-accent-primary/10 blur-[100px] rounded-full -z-10" />
                </FadeIn>
            </div>
        </section>
    );
}

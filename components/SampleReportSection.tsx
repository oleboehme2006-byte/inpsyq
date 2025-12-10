"use client";

import FadeIn from "./ui/FadeIn";
import { Download } from "lucide-react";

export default function SampleReportSection() {
    return (
        <section id="sample-report" className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-6 text-center">
                <FadeIn className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">A glimpse into an InPsyQ report</h2>

                    <div className="relative group cursor-default">
                        {/* Report Card */}
                        <div className="bg-surface-card border border-white/10 rounded-xl p-8 md:p-12 text-left shadow-2xl relative z-10 transition-transform group-hover:translate-y-[-5px]">
                            <div className="flex border-b border-white/10 pb-6 mb-6 justify-between items-center">
                                <div>
                                    <div className="text-xs text-accent-secondary uppercase tracking-widest mb-1">Confidential Report</div>
                                    <h3 className="text-2xl font-bold text-white">Project: Automotive EV Shift</h3>
                                </div>
                                <div className="text-text-muted text-sm">Oct 2025</div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h4 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Emotional Landscape</h4>
                                    <div className="h-32 bg-white/5 rounded-lg flex items-center justify-center text-xs text-text-muted">
                                        [Interactive Heatmap Visualization]
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Key Narratives</h4>
                                    <ul className="space-y-2 text-sm text-gray-300">
                                        <li className="flex gap-2">
                                            <span className="text-green-500">↑</span> Rising trust around solution-focused messaging
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-red-500">↓</span> Fear-framed narratives losing traction
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-accent-primary">•</span> Anger spikes mapped to infrastructure delays
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-lg p-4">
                                <h4 className="text-accent-primary font-bold mb-2 text-sm">STRATEGIC OPPORTUNITY</h4>
                                <p className="text-sm text-gray-300">
                                    Shift communication focus from technical range specs to "freedom of movement" narratives to capture the emerging optimistic emotional cluster.
                                </p>
                            </div>
                        </div>

                        {/* Back Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-accent-primary/20 blur-[100px] rounded-full -z-10" />
                    </div>

                    <div className="mt-12">
                        <a
                            href="mailto:hello@inpsyq.ai"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black hover:bg-gray-200 font-bold rounded-lg transition-colors shadow-lg shadow-white/10"
                        >
                            <Download className="w-5 h-5" />
                            Request Sample Report
                        </a>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}

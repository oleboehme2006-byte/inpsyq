"use client";

import FadeIn from "./ui/FadeIn";
import { Layers, Unlock, Server } from "lucide-react";

export default function ExplainerSection() {
    return (
        <section className="py-24 bg-[#050509] relative">
            <div className="container mx-auto px-6 max-w-5xl">
                <FadeIn>
                    <div className="border border-accent-secondary/20 bg-accent-secondary/5 rounded-2xl p-8 md:p-12 mb-16">
                        <h2 className="text-3xl font-bold text-white mb-6">What InPsyq Really Does</h2>
                        <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
                            <p>
                                InPsyq is not a traditional listening tool. It is a <strong className="text-accent-secondary">psychological signal extraction engine</strong> that processes large-scale, aggregated public discourse.
                            </p>
                            <p>
                                Unlike standard sentiment analysis—which only tells you if posts are positive or negative—InPsyq uses advanced vectorization and clustering to detect deeper emotional structures: anxiety, trust, anger, hope, and specific narrative framings.
                            </p>
                            <p>
                                We process minimal, non-identifiable data points from public streams to map how collective psychology shifts over time. This gives you the "Why" behind the "What", without ever profiling individuals.
                            </p>
                        </div>
                    </div>
                </FadeIn>

                <div className="grid md:grid-cols-3 gap-8">
                    <FadeIn delay={0.2}>
                        <div className="bg-surface-dark p-6 rounded-xl border border-white/5 h-full">
                            <Server className="w-8 h-8 text-accent-primary mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Aggregated Sources</h3>
                            <p className="text-sm text-text-muted">
                                We analyze public, topic-based data streams. Our engine filters out PII at the source, focusing solely on linguistic patterns and discourse dynamics.
                            </p>
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.3}>
                        <div className="bg-surface-dark p-6 rounded-xl border border-white/5 h-full">
                            <Layers className="w-8 h-8 text-accent-secondary mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Deep Vectorization</h3>
                            <p className="text-sm text-text-muted">
                                Text is converted into high-dimensional vectors to measure semantic distance, allowing us to cluster subtle emotional variations that keyword matching misses.
                            </p>
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.4}>
                        <div className="bg-surface-dark p-6 rounded-xl border border-white/5 h-full">
                            <Unlock className="w-8 h-8 text-white mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Actionable Strategy</h3>
                            <p className="text-sm text-text-muted">
                                Turn abstract psychological concepts into concrete communication strategies. Know exactly which narrative frames build trust vs. fear.
                            </p>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}

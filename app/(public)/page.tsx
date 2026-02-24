'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Activity, PlayCircle, Eye, ArrowRight, Brain, Zap, ShieldCheck } from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { InPsyqLogo } from '@/components/shared/InPsyqLogo';
import { LanguageToggle } from '@/components/landing/LanguageToggle';
import { animate, utils } from 'animejs';

export default function LandingPage() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Setup Intersection Observers to trigger Anime.js animations when sections come into view
        const sections = document.querySelectorAll('section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Simple hook for section-specific animations
                    if (entry.target.id === 'pain-section') {
                        animate('.drifting-node', {
                            translateX: () => utils.random(-50, 50),
                            translateY: () => utils.random(-50, 50),
                            scale: [0.8, 1.2],
                            opacity: [0.3, 0.8],
                            delay: utils.stagger(200),
                            duration: 3000,
                            direction: 'alternate',
                            loop: true,
                            ease: 'inOutSine'
                        });
                    }
                }
            });
        }, { threshold: 0.2 });

        sections.forEach(sec => observer.observe(sec));

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="min-h-screen bg-bg-base text-text-primary flex flex-col font-body selection:bg-accent-primary/30 overflow-x-hidden relative">

            {/* Navigation */}
            <nav className="w-full border-b border-white/5 bg-bg-base/80 backdrop-blur-md fixed top-0 z-50 transition-all">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <InPsyqLogo size="sm" />
                    </Link>
                    <div className="flex items-center gap-6">
                        <LanguageToggle />
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                                    Log in
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                        <Link
                            href="/tutorial"
                            className="px-5 py-2 rounded-lg bg-[#8B5CF6] text-white text-sm font-medium hover:bg-[#7C3AED] transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center gap-2"
                        >
                            <PlayCircle className="w-4 h-4" /> Tour
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex flex-col relative z-10 w-full pt-16">

                {/* 1. The Hook (The Awakening) */}
                <section id="hook-section" className="relative min-h-[90vh] px-6 flex flex-col items-center justify-center text-center">
                    {/* Faint White Glow for Absolute Clarity */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[150px] -z-10 pointer-events-none" />

                    <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-6">
                        <video
                            className="w-full h-full object-contain"
                            autoPlay
                            muted
                            playsInline
                            loop={false}
                        >
                            <source src="/inpsyq_loader.mp4" type="video/mp4" />
                        </video>
                    </div>

                    <h1 className="max-w-4xl text-5xl md:text-7xl font-display font-bold text-white tracking-tight mb-6">
                        Measure the Unmeasurable.
                    </h1>

                    <p className="max-w-2xl text-lg text-text-secondary mb-12 leading-relaxed">
                        The first AI-native diagnostic instrument that quantifies the psychological bandwidth driving your delivery timelines.
                    </p>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-tertiary">
                        <span className="text-[10px] uppercase font-mono tracking-widest">Scroll</span>
                        <div className="w-[1px] h-12 bg-gradient-to-b from-white/30 to-transparent" />
                    </div>
                </section>

                {/* 2. The Comparison (Augmenting the Expert) */}
                <section id="comparison-section" className="py-32 px-6 border-t border-white/5 relative">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight mb-4">
                                The precision of a psychologist.<br />The scale of a machine.
                            </h2>
                            <p className="text-text-tertiary font-mono text-sm">TRADITIONAL HR VS. INPSYQ SYSTEM</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                            <div className="card border-white/5 bg-transparent p-8 flex flex-col justify-center">
                                <h3 className="text-text-secondary font-medium mb-6 uppercase tracking-wider text-sm">Status Quo</h3>
                                <ul className="space-y-6">
                                    <li className="flex flex-col"><span className="text-white font-medium">Episodic Observation</span><span className="text-text-tertiary text-sm">Quarterly or annual surveys.</span></li>
                                    <li className="flex flex-col"><span className="text-white font-medium">Subjective Sentiment</span><span className="text-text-tertiary text-sm">Feelings, untethered from context.</span></li>
                                    <li className="flex flex-col"><span className="text-white font-medium">Trailing Lag-Metrics</span><span className="text-text-tertiary text-sm">Measuring attrition after it happens.</span></li>
                                </ul>
                            </div>
                            <div className="card border-white/10 bg-[#0A0A0A] p-8 shadow-[0_0_30px_rgba(255,255,255,0.02)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] pointer-events-none" />
                                <h3 className="text-white font-medium mb-6 uppercase tracking-wider text-sm flex items-center gap-2"><InPsyqLogo size="sm" /> Expert Intelligence</h3>
                                <ul className="space-y-6">
                                    <li className="flex flex-col"><span className="text-white font-medium">Continuous Telemetry</span><span className="text-text-secondary text-sm">Weekly, low-friction psychometric pulses.</span></li>
                                    <li className="flex flex-col"><span className="text-white font-medium">Validated Causal Indices</span><span className="text-text-secondary text-sm">Root-cause identification via behavioral science.</span></li>
                                    <li className="flex flex-col"><span className="text-white font-medium">Leading Risk Indicators</span><span className="text-text-secondary text-sm">Detecting trust gaps before delivery breaks.</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. The Pain (The Latent Rot) */}
                <section id="pain-section" className="py-40 px-6 relative overflow-hidden border-t border-white/5">
                    {/* Semantic Strain & Withdrawal Blooms */}
                    <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-[#E11D48]/10 rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-[#F59E0B]/10 rounded-full blur-[150px] -z-10 pointer-events-none" />

                    {/* Drifting Nodes representing chaos/strain */}
                    <div className="absolute inset-0 -z-5 overflow-hidden pointer-events-none opacity-50">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i}
                                className="drifting-node absolute rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
                                style={{
                                    width: Math.random() * 40 + 10 + 'px',
                                    height: Math.random() * 40 + 10 + 'px',
                                    top: Math.random() * 100 + '%',
                                    left: Math.random() * 100 + '%'
                                }}
                            />
                        ))}
                    </div>

                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E11D48]/10 border border-[#E11D48]/20 text-xs font-mono text-[#E11D48] mb-8">
                            <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse"></span>
                            Systemic Strain Detected
                        </div>
                        <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight mb-8">
                            You are managing the symptoms.<br />The cause is invisible.
                        </h2>
                        <p className="text-xl text-text-secondary leading-relaxed max-w-3xl mx-auto">
                            Burnout, attrition, and missed deadlines are lag metrics. By the time they hit your dashboard, the damage is done. You are flying blind on the most critical driver of your organization: <strong className="text-white font-medium">psychological safety and bandwidth</strong>.
                        </p>
                    </div>
                </section>

                {/* 4. The Mechanism (The 2-Minute Pulse) */}
                <section id="mechanism-section" className="py-40 px-6 relative bg-bg-base border-t border-white/5">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-6">
                                Continuous intelligence.<br />Zero friction.
                            </h2>
                            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                                A 10-question pulse check. 2 minutes a week. We don&apos;t track keystrokes—we measure trust, systemic friction, and cognitive bandwidth through validated psychometric instruments.
                            </p>
                            <Link
                                href="/measure"
                                className="inline-flex px-8 py-4 rounded-lg bg-bg-surface border border-[#8B5CF6]/50 text-white font-medium hover:bg-[#8B5CF6]/10 transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] items-center gap-3"
                            >
                                <Zap className="w-5 h-5 text-[#8B5CF6]" />
                                Enter Employee Demo
                            </Link>
                        </div>
                        <div className="relative">
                            {/* Mockup Container */}
                            <div className="relative mx-auto w-full max-w-sm rounded-[2.5rem] bg-[#050505] p-2 border border-white/10 shadow-2xl">
                                <div className="absolute top-0 inset-x-0 h-6 bg-black rounded-t-[2.5rem] flex justify-center items-end pb-1">
                                    <div className="w-16 h-4 bg-black rounded-full" />
                                </div>
                                <div className="rounded-[2rem] overflow-hidden bg-bg-base h-[600px] border border-white/5 relative flex flex-col pt-12 p-6">
                                    <div className="flex items-center gap-2 mb-8 opacity-80">
                                        <InPsyqLogo size="sm" />
                                    </div>
                                    <div className="space-y-6">
                                        <div className="h-4 w-1/3 bg-white/10 rounded-full"></div>
                                        <div className="h-8 w-3/4 bg-white/20 rounded-md"></div>
                                        <div className="space-y-3 pt-6">
                                            <div className="h-12 w-full bg-white/5 rounded-lg border border-white/10 flex items-center px-4"><div className="w-4 h-4 rounded-full border border-white/20"></div></div>
                                            <div className="h-12 w-full bg-[#8B5CF6]/20 rounded-lg border border-[#8B5CF6]/40 flex items-center px-4"><div className="w-4 h-4 rounded-full bg-[#8B5CF6]"></div></div>
                                            <div className="h-12 w-full bg-white/5 rounded-lg border border-white/10 flex items-center px-4"><div className="w-4 h-4 rounded-full border border-white/20"></div></div>
                                            <div className="h-12 w-full bg-white/5 rounded-lg border border-white/10 flex items-center px-4"><div className="w-4 h-4 rounded-full border border-white/20"></div></div>
                                        </div>
                                        <div className="pt-8 flex justify-end">
                                            <div className="h-10 w-24 bg-[#8B5CF6] rounded-md"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. The Solution Gateway & Translation */}
                <section id="gateway-section" className="py-40 px-6 relative border-t border-white/5 overflow-hidden">
                    {/* Semantic Trust-Gap & Engagement Blooms */}
                    <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-[#0EA5E9]/10 rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-[#10B981]/10 rounded-full blur-[150px] -z-10 pointer-events-none" />

                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 text-xs font-mono text-[#0EA5E9] mb-8">
                            <span className="w-2 h-2 rounded-full bg-[#0EA5E9]"></span>
                            Signal Space Aligned
                        </div>

                        <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight mb-8">
                            Data without interpretation<br />is just liability.
                        </h2>
                        <p className="text-xl text-text-secondary leading-relaxed max-w-3xl mx-auto mb-16">
                            inPsyq&apos;s AI aggregates weekly responses, identifies causal systemic drivers, and generates actionable narrative briefings. Instantly.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                            <Link
                                href="/executive"
                                className="group relative p-1 rounded-xl bg-gradient-to-b from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-[#0EA5E9]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                                <div className="bg-[#050505] rounded-lg p-8 h-full relative z-10 flex flex-col items-center justify-center border border-white/5">
                                    <Activity className="w-8 h-8 text-[#0EA5E9] mb-4" />
                                    <h3 className="text-lg font-medium text-white mb-2">Exploratory Demonstrations</h3>
                                    <p className="text-sm text-text-tertiary">Access live interactive sandbox data.</p>
                                </div>
                            </Link>

                            <Link
                                href="/tutorial"
                                className="group relative p-1 rounded-xl bg-gradient-to-b from-[#8B5CF6]/40 to-[#8B5CF6]/10 hover:from-[#8B5CF6]/60 hover:to-[#8B5CF6]/20 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-[#8B5CF6]/30 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                                <div className="bg-[#0A0A0A] rounded-lg p-8 h-full relative z-10 flex flex-col items-center justify-center border border-[#8B5CF6]/20">
                                    <Brain className="w-8 h-8 text-[#8B5CF6] mb-4" />
                                    <h3 className="text-lg font-medium text-white mb-2">Guided Platform Tutorial</h3>
                                    <p className="text-sm text-text-tertiary">Learn to interpret the psychological data.</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-10 px-6 relative z-10 bg-bg-base">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <InPsyqLogo size="sm" />
                        <span className="text-xs text-text-tertiary">© 2026 inPsyq GmbH. All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-8 text-xs text-text-tertiary font-mono">
                        <Link href="/privacy" className="hover:text-text-secondary transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-text-secondary transition-colors">Terms</Link>
                        <Link href="/imprint" className="hover:text-text-secondary transition-colors">Imprint</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

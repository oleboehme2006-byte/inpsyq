'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Activity, PlayCircle, Brain, Zap, FlaskConical, UserCheck, Settings2, LayoutDashboard, Mail } from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { InPsyqLogo } from '@/components/shared/InPsyqLogo';
import { LanguageToggle } from '@/components/landing/LanguageToggle';
import { LanguageProvider, useLanguage } from '@/hooks/useLanguage';
import { content } from '@/lib/landing/content';
import { animate, utils } from 'animejs';

// ─────────────────────────────────────────────────────────────────────────────
// Inner page (needs the LanguageProvider context)
// ─────────────────────────────────────────────────────────────────────────────
function LandingPageInner() {
    const { lang } = useLanguage();
    const c = content[lang];

    useEffect(() => {
        const sections = document.querySelectorAll('section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
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
                            ease: 'inOutSine',
                        });
                    }
                }
            });
        }, { threshold: 0.2 });
        sections.forEach(sec => observer.observe(sec));
        return () => observer.disconnect();
    }, []);

    const trackIcons: Record<string, React.ReactNode> = {
        EXECUTIVE: <Activity className="w-6 h-6" />,
        TEAMLEAD: <LayoutDashboard className="w-6 h-6" />,
        EMPLOYEE: <UserCheck className="w-6 h-6" />,
        ADMIN: <Settings2 className="w-6 h-6" />,
    };

    return (
        <div className="min-h-screen bg-bg-base text-text-primary flex flex-col font-body selection:bg-accent-primary/30 overflow-x-hidden relative">

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
                                    {c.nav.login}
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
                            <PlayCircle className="w-4 h-4" /> {c.nav.tour}
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex flex-col relative z-10 w-full pt-16">

                {/* 1. Hero */}
                <section id="hook-section" className="relative min-h-[90vh] px-6 flex flex-col items-center justify-center text-center">
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
                        {c.hero.headline}
                    </h1>
                    <p className="max-w-2xl text-lg text-text-secondary mb-12 leading-relaxed">
                        {c.hero.sub}
                    </p>
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-tertiary">
                        <span className="text-[10px] uppercase font-mono tracking-widest">{c.hero.scroll}</span>
                        <div className="w-[1px] h-12 bg-gradient-to-b from-white/30 to-transparent" />
                    </div>
                </section>

                {/* 2. Comparison */}
                <section id="comparison-section" className="py-32 px-6 border-t border-white/5 relative">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight mb-4 whitespace-pre-line">
                                {c.comparison.headline}
                            </h2>
                            <p className="text-text-tertiary font-mono text-sm">{c.comparison.subline}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                            <div className="card border-white/5 bg-transparent p-8 flex flex-col justify-center">
                                <h3 className="text-text-secondary font-medium mb-6 uppercase tracking-wider text-sm">{c.comparison.statusQuo.title}</h3>
                                <ul className="space-y-6">
                                    {c.comparison.statusQuo.items.map(item => (
                                        <li key={item.title} className="flex flex-col">
                                            <span className="text-white font-medium">{item.title}</span>
                                            <span className="text-text-tertiary text-sm">{item.desc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="card border-white/10 bg-[#0A0A0A] p-8 shadow-[0_0_30px_rgba(255,255,255,0.02)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] pointer-events-none" />
                                <h3 className="text-white font-medium mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                                    <InPsyqLogo size="sm" /> {c.comparison.inpsyq.title}
                                </h3>
                                <ul className="space-y-6">
                                    {c.comparison.inpsyq.items.map(item => (
                                        <li key={item.title} className="flex flex-col">
                                            <span className="text-white font-medium">{item.title}</span>
                                            <span className="text-text-secondary text-sm">{item.desc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. The Pain */}
                <section id="pain-section" className="py-40 px-6 relative overflow-hidden border-t border-white/5">
                    <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-[#E11D48]/10 rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-[#F59E0B]/10 rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="absolute inset-0 -z-5 overflow-hidden pointer-events-none opacity-50">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i}
                                className="drifting-node absolute rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
                                style={{
                                    width: Math.random() * 40 + 10 + 'px',
                                    height: Math.random() * 40 + 10 + 'px',
                                    top: Math.random() * 100 + '%',
                                    left: Math.random() * 100 + '%',
                                }}
                            />
                        ))}
                    </div>
                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E11D48]/10 border border-[#E11D48]/20 text-xs font-mono text-[#E11D48] mb-8">
                            <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse"></span>
                            {c.pain.badge}
                        </div>
                        <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight mb-8 whitespace-pre-line">
                            {c.pain.headline}
                        </h2>
                        <p className="text-xl text-text-secondary leading-relaxed max-w-3xl mx-auto">
                            {c.pain.body}
                        </p>
                    </div>
                </section>

                {/* 4. Mechanism */}
                <section id="mechanism-section" className="py-40 px-6 relative bg-bg-base border-t border-white/5">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-6 whitespace-pre-line">
                                {c.mechanism.headline}
                            </h2>
                            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                                {c.mechanism.body}
                            </p>
                            <Link
                                href="/measure"
                                className="inline-flex px-8 py-4 rounded-lg bg-bg-surface border border-[#8B5CF6]/50 text-white font-medium hover:bg-[#8B5CF6]/10 transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] items-center gap-3"
                            >
                                <Zap className="w-5 h-5 text-[#8B5CF6]" />
                                {c.mechanism.cta}
                            </Link>
                        </div>
                        <div className="relative">
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

                {/* 5. The Science */}
                <section id="science-section" className="py-40 px-6 relative border-t border-white/5 overflow-hidden">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#8B5CF6]/5 rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-20">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-xs font-mono text-[#8B5CF6] mb-8">
                                <FlaskConical className="w-3 h-3" />
                                {c.science.badge}
                            </div>
                            <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-6 whitespace-pre-line">
                                {c.science.headline}
                            </h2>
                            <p className="text-xl text-text-secondary leading-relaxed max-w-3xl mx-auto">
                                {c.science.body}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {c.science.pillars.map((pillar, i) => {
                                const pillarIcons = [
                                    <Brain key="brain" className="w-8 h-8 text-[#8B5CF6]" />,
                                    <Activity key="activity" className="w-8 h-8 text-[#0EA5E9]" />,
                                    <Zap key="zap" className="w-8 h-8 text-[#10B981]" />,
                                ];
                                return (
                                    <div key={pillar.title} className="p-8 rounded-2xl bg-[#050505] border border-white/8">
                                        <div className="mb-6">{pillarIcons[i]}</div>
                                        <h3 className="text-lg font-display font-bold text-white mb-4">{pillar.title}</h3>
                                        <p className="text-text-secondary text-sm leading-relaxed">{pillar.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 6. Gateway */}
                <section id="gateway-section" className="py-40 px-6 relative border-t border-white/5 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-[#0EA5E9]/10 rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-[#10B981]/10 rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 text-xs font-mono text-[#0EA5E9] mb-8">
                            <span className="w-2 h-2 rounded-full bg-[#0EA5E9]"></span>
                            {c.gateway.badge}
                        </div>
                        <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight mb-8 whitespace-pre-line">
                            {c.gateway.headline}
                        </h2>
                        <p className="text-xl text-text-secondary leading-relaxed max-w-3xl mx-auto mb-16">
                            {c.gateway.body}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                            <Link
                                href="/executive"
                                className="group relative p-1 rounded-xl bg-gradient-to-b from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-[#0EA5E9]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                                <div className="bg-[#050505] rounded-lg p-8 h-full relative z-10 flex flex-col items-center justify-center border border-white/5">
                                    <Activity className="w-8 h-8 text-[#0EA5E9] mb-4" />
                                    <h3 className="text-lg font-medium text-white mb-2">{c.gateway.demoLabel}</h3>
                                    <p className="text-sm text-text-tertiary">{c.gateway.demoSub}</p>
                                </div>
                            </Link>
                            <Link
                                href="/tutorial"
                                className="group relative p-1 rounded-xl bg-gradient-to-b from-[#8B5CF6]/40 to-[#8B5CF6]/10 hover:from-[#8B5CF6]/60 hover:to-[#8B5CF6]/20 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-[#8B5CF6]/30 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                                <div className="bg-[#0A0A0A] rounded-lg p-8 h-full relative z-10 flex flex-col items-center justify-center border border-[#8B5CF6]/20">
                                    <Brain className="w-8 h-8 text-[#8B5CF6] mb-4" />
                                    <h3 className="text-lg font-medium text-white mb-2">{c.gateway.tutorialLabel}</h3>
                                    <p className="text-sm text-text-tertiary">{c.gateway.tutorialSub}</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* 7. Tutorial CTA per Role */}
                <section id="tutorial-section" className="py-40 px-6 border-t border-white/5 relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#8B5CF6]/3 to-transparent -z-10 pointer-events-none" />
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-6">
                                {c.tutorialCta.headline}
                            </h2>
                            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                                {c.tutorialCta.sub}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {c.tutorialCta.tracks.map(track => (
                                <Link key={track.role} href={track.href} className="group block">
                                    <div
                                        className="relative h-full rounded-2xl bg-[#050505] border border-white/8 p-8 transition-all duration-300 overflow-hidden"
                                        style={{ ['--track-color' as string]: track.color }}
                                    >
                                        <div
                                            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] -z-0 opacity-20 group-hover:opacity-40 transition-opacity"
                                            style={{ backgroundColor: track.color }}
                                        />
                                        <div className="relative z-10">
                                            <div className="mb-6" style={{ color: track.color }}>
                                                {trackIcons[track.role]}
                                            </div>
                                            <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: track.color }}>
                                                {track.role}
                                            </div>
                                            <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:opacity-90 transition-opacity">
                                                {track.title}
                                            </h3>
                                            <p className="text-text-secondary text-sm leading-relaxed">
                                                {track.desc}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 8. Pricing / Contact */}
                <section id="pricing-section" className="py-40 px-6 border-t border-white/5 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050505]/50 -z-10 pointer-events-none" />
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-6 whitespace-pre-line">
                            {c.pricing.headline}
                        </h2>
                        <p className="text-xl text-text-secondary leading-relaxed mb-12">
                            {c.pricing.sub}
                        </p>
                        <div className="flex flex-col items-center gap-4">
                            <a
                                href="mailto:hello@inpsyq.com"
                                className="inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-white text-bg-base font-semibold text-lg hover:bg-white/90 transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                            >
                                <Mail className="w-5 h-5" />
                                {c.pricing.cta}
                            </a>
                            <p className="text-xs text-text-tertiary font-mono">{c.pricing.note}</p>
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-10 px-6 relative z-10 bg-bg-base">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <InPsyqLogo size="sm" />
                        <span className="text-xs text-text-tertiary">{c.footer.rights}</span>
                    </div>
                    <div className="flex items-center gap-8 text-xs text-text-tertiary font-mono">
                        <Link href="/privacy" className="hover:text-text-secondary transition-colors">{c.footer.privacy}</Link>
                        <Link href="/terms" className="hover:text-text-secondary transition-colors">{c.footer.terms}</Link>
                        <Link href="/imprint" className="hover:text-text-secondary transition-colors">{c.footer.imprint}</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export — wraps in LanguageProvider
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
    return (
        <LanguageProvider>
            <LandingPageInner />
        </LanguageProvider>
    );
}

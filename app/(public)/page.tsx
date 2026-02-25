'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, Brain, Zap, FlaskConical, UserCheck, Settings2, LayoutDashboard, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { InPsyqLogo } from '@/components/shared/InPsyqLogo';
import { LanguageProvider, useLanguage } from '@/hooks/useLanguage';
import { content } from '@/lib/landing/content';
import type { Lang } from '@/lib/landing/content';

// ─────────────────────────────────────────────────────────────────────────────
// Inner page (needs the LanguageProvider context)
// ─────────────────────────────────────────────────────────────────────────────
function LandingPageInner() {
    const { lang, setLang } = useLanguage();
    const c = content[lang];

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
                    <div className="flex items-center gap-4">
                        {/* Language toggle pill */}
                        <button
                            onClick={() => setLang(lang === 'EN' ? 'DE' : 'EN')}
                            className="px-3 py-1 rounded-full border border-white/10 text-xs font-mono text-text-secondary hover:text-white hover:border-white/20 transition-all"
                        >
                            {c.nav.langToggle}
                        </button>
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
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex flex-col relative z-10 w-full pt-16">

                {/* 1. Hero */}
                <section className="relative min-h-[90vh] px-6 flex flex-col items-center justify-center text-center">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="relative w-40 h-40 sm:w-52 sm:h-52 mb-8">
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
                    <h1 className="max-w-4xl text-5xl md:text-7xl font-display font-bold text-white tracking-tight mb-6 whitespace-pre-line">
                        {c.hero.headline}
                    </h1>
                    <p className="max-w-2xl text-lg text-text-secondary mb-12 leading-relaxed">
                        {c.hero.sub}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Link
                            href="/tutorial"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#8B5CF6] text-white font-semibold hover:bg-[#7C3AED] transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]"
                        >
                            Explore the Platform <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a
                            href="mailto:hello@inpsyq.com"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-text-secondary hover:text-white hover:border-white/20 transition-all font-medium"
                        >
                            <Mail className="w-4 h-4" /> {c.pricing.cta}
                        </a>
                    </div>
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-tertiary">
                        <span className="text-[10px] uppercase font-mono tracking-widest">{c.hero.scroll}</span>
                        <div className="w-[1px] h-12 bg-gradient-to-b from-white/30 to-transparent" />
                    </div>
                </section>

                {/* 2. Problem */}
                <section className="py-40 px-6 relative overflow-hidden border-t border-white/5">
                    <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-[#E11D48]/8 rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-[#F59E0B]/8 rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="max-w-6xl mx-auto">
                        <div className="max-w-3xl mb-20">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E11D48]/10 border border-[#E11D48]/20 text-xs font-mono text-[#E11D48] mb-8">
                                <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
                                {c.problem.badge}
                            </div>
                            <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-8 whitespace-pre-line">
                                {c.problem.headline}
                            </h2>
                            <p className="text-xl text-text-secondary leading-relaxed">
                                {c.problem.body}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {c.problem.items.map((item) => (
                                <div key={item.title} className="p-8 rounded-2xl bg-[#050505] border border-white/8">
                                    <div className="w-8 h-8 rounded-full bg-[#E11D48]/10 border border-[#E11D48]/20 mb-6 flex items-center justify-center">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                                    </div>
                                    <h3 className="text-base font-display font-semibold text-white mb-3">{item.title}</h3>
                                    <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3. How It Works */}
                <section className="py-40 px-6 relative border-t border-white/5">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0EA5E9]/5 rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-20">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 text-xs font-mono text-[#0EA5E9] mb-8">
                                <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
                                {c.howItWorks.badge}
                            </div>
                            <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-6 whitespace-pre-line">
                                {c.howItWorks.headline}
                            </h2>
                            <p className="text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto">
                                {c.howItWorks.body}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {c.howItWorks.steps.map((step, i) => (
                                <div key={step.step} className="flex gap-6 p-8 rounded-2xl bg-[#050505] border border-white/8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#0EA5E9]/5 rounded-full blur-[40px] pointer-events-none" />
                                    <div className="shrink-0">
                                        <span className="text-5xl font-display font-bold text-white/10 leading-none">{step.step}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-display font-semibold text-white mb-3">{step.title}</h3>
                                        <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4. Science */}
                <section className="py-40 px-6 relative border-t border-white/5 overflow-hidden">
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

                {/* 5. Role Demos */}
                <section className="py-40 px-6 border-t border-white/5 relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#8B5CF6]/3 to-transparent -z-10 pointer-events-none" />
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-xs font-mono text-[#8B5CF6] mb-8">
                                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                                {c.roleDemos.badge}
                            </div>
                            <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight mb-6 whitespace-pre-line">
                                {c.roleDemos.headline}
                            </h2>
                            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                                {c.roleDemos.sub}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {c.roleDemos.tracks.map(track => (
                                <Link key={track.role} href={track.href} className="group block">
                                    <div
                                        className="relative h-full rounded-2xl bg-[#050505] border border-white/8 p-8 transition-all duration-300 overflow-hidden hover:border-white/15"
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
                                            <p className="text-text-secondary text-sm leading-relaxed mb-6">
                                                {track.desc}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs font-mono" style={{ color: track.color }}>
                                                Open Tour <ArrowRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 6. Pricing */}
                <section className="py-40 px-6 border-t border-white/5 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050505]/50 -z-10 pointer-events-none" />
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-text-secondary mb-8">
                            {c.pricing.badge}
                        </div>
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

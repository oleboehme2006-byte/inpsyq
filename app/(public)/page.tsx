'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
    Activity, Brain, Zap, FlaskConical, UserCheck, Settings2,
    LayoutDashboard, Mail, ArrowRight, ChevronDown
} from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { InPsyqLogo } from '@/components/shared/InPsyqLogo';
import { LanguageProvider, useLanguage } from '@/hooks/useLanguage';
import { content } from '@/lib/landing/content';
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
} from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const staggerContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
};

const cardFromLeft = {
    hidden: { opacity: 0, x: -120, rotate: -6 },
    show: { opacity: 1, x: 0, rotate: 0, transition: { type: 'spring', damping: 20, stiffness: 100 } },
};

const cardFromRight = {
    hidden: { opacity: 0, x: 120, rotate: 6 },
    show: { opacity: 1, x: 0, rotate: 0, transition: { type: 'spring', damping: 20, stiffness: 100 } },
};

const wordReveal = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

/* ═══════════════════════════════════════════════════════════════════════════
   3D TILT CARD
   ═══════════════════════════════════════════════════════════════════════════ */

function TiltCard({ children, glowColor, className = '' }: {
    children: React.ReactNode;
    glowColor: string;
    className?: string;
}) {
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            className={`relative ${className}`}
            style={{ perspective: 800 }}
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                setTilt({ rotateX: y * -10, rotateY: x * 10 });
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setTilt({ rotateX: 0, rotateY: 0 }); setIsHovered(false); }}
            animate={{
                rotateX: tilt.rotateX,
                rotateY: tilt.rotateY,
                scale: isHovered ? 1.02 : 1,
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
            <div
                className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none"
                style={{
                    boxShadow: `0 0 30px ${glowColor}40, 0 0 60px ${glowColor}20`,
                    opacity: isHovered ? 1 : 0,
                }}
            />
            {children}
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   INNER PAGE — needs LanguageProvider context
   ═══════════════════════════════════════════════════════════════════════════ */

function LandingPageInner() {
    const { lang, setLang } = useLanguage();
    const c = content[lang];

    // ── Global scroll tracking ──
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    // ── Hero parallax ──
    const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.92]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
    const orbY1 = useTransform(scrollYProgress, [0, 0.3], [0, -200]);
    const orbY2 = useTransform(scrollYProgress, [0, 0.3], [0, -120]);
    const orbY3 = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

    // ── How It Works pipeline ──
    const pipelineRef = useRef(null);
    const { scrollYProgress: pipelineProgress } = useScroll({
        target: pipelineRef,
        offset: ['start end', 'end start'],
    });
    const lineHeight = useTransform(pipelineProgress, [0.1, 0.7], ['0%', '100%']);
    const stepOpacities = [
        useTransform(pipelineProgress, [0.12, 0.22], [0, 1]),
        useTransform(pipelineProgress, [0.25, 0.35], [0, 1]),
        useTransform(pipelineProgress, [0.38, 0.48], [0, 1]),
        useTransform(pipelineProgress, [0.51, 0.61], [0, 1]),
    ];

    // ── Pricing cinematic ──
    const pricingRef = useRef(null);
    const { scrollYProgress: pricingProgress } = useScroll({
        target: pricingRef,
        offset: ['start end', 'end start'],
    });
    const pricingScale = useTransform(pricingProgress, [0.15, 0.45], [0.85, 1]);
    const pricingBlur = useTransform(pricingProgress, [0.15, 0.45], [4, 0]);

    // ── Background morph ──
    const bgHue = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [
        'rgba(0,0,0,0)',
        'rgba(225,29,72,0.03)',
        'rgba(14,165,233,0.03)',
        'rgba(139,92,246,0.02)',
        'rgba(0,0,0,0)',
    ]);

    // ── Track icons ──
    const trackIcons: Record<string, React.ReactNode> = {
        EXECUTIVE: <Activity className="w-6 h-6" />,
        TEAMLEAD: <LayoutDashboard className="w-6 h-6" />,
        EMPLOYEE: <UserCheck className="w-6 h-6" />,
        ADMIN: <Settings2 className="w-6 h-6" />,
    };

    // ── Headline word splitter ──
    const heroWords = c.hero.headline.split('\n').map(line => line.split(' '));

    return (
        <div className="min-h-screen bg-bg-base text-text-primary flex flex-col font-body selection:bg-accent-primary/30 overflow-x-hidden relative">

            {/* ── Global scroll progress bar ── */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left"
                style={{
                    scaleX,
                    background: 'linear-gradient(90deg, #8B5CF6, #0EA5E9, #10B981)',
                }}
            />

            {/* ── Background colour morph ── */}
            <motion.div
                className="fixed inset-0 pointer-events-none z-0"
                style={{ backgroundColor: bgHue }}
            />

            {/* ═══════════════════════════════════════════════════════════════
                NAVIGATION
               ═══════════════════════════════════════════════════════════════ */}
            <nav className="w-full border-b border-white/5 bg-bg-base/80 backdrop-blur-md fixed top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <InPsyqLogo size="sm" />
                    </Link>
                    <div className="flex items-center gap-4">
                        {/* Language toggle pill */}
                        <button
                            onClick={() => setLang(lang === 'EN' ? 'DE' : 'EN')}
                            className="px-3 py-1 rounded-full border border-white/10 text-xs font-mono text-text-secondary hover:text-white hover:border-white/30 transition-all"
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

                {/* ═══════════════════════════════════════════════════════════
                    1. HERO — Parallax Orbs + Staggered Type
                   ═══════════════════════════════════════════════════════════ */}
                <section className="relative min-h-[100vh] px-6 flex flex-col items-center justify-center text-center overflow-hidden">

                    {/* Parallax orbs */}
                    <motion.div
                        className="absolute w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none"
                        style={{ y: orbY1, top: '15%', left: '10%', backgroundColor: 'rgba(225,29,72,0.15)' }}
                    />
                    <motion.div
                        className="absolute w-[250px] h-[250px] rounded-full blur-[100px] pointer-events-none"
                        style={{ y: orbY2, top: '25%', right: '15%', backgroundColor: 'rgba(14,165,233,0.12)' }}
                    />
                    <motion.div
                        className="absolute w-[200px] h-[200px] rounded-full blur-[80px] pointer-events-none"
                        style={{ y: orbY3, bottom: '20%', left: '30%', backgroundColor: 'rgba(245,158,11,0.1)' }}
                    />

                    {/* Hero content — scales down on scroll */}
                    <motion.div
                        className="relative z-10 max-w-5xl"
                        style={{ scale: heroScale, opacity: heroOpacity }}
                    >
                        {/* Logo with animated underline */}
                        <motion.div
                            className="mb-10 inline-block"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="relative inline-block">
                                <span className="text-4xl font-display font-semibold text-white tracking-tight">inPsyq</span>
                                <motion.div
                                    className="absolute -bottom-1.5 left-0 w-full h-1 bg-[#8B5CF6] rounded-full shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                                    style={{ transformOrigin: 'left' }}
                                />
                            </div>
                        </motion.div>

                        {/* Headline — word-by-word reveal */}
                        <motion.h1
                            className="text-5xl md:text-7xl font-display font-bold text-white tracking-tight mb-8 leading-[1.1]"
                            initial="hidden"
                            animate="show"
                            variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.6 } } }}
                        >
                            {heroWords.map((line, li) => (
                                <span key={li} className="block">
                                    {line.map((word, wi) => (
                                        <motion.span
                                            key={`${li}-${wi}`}
                                            className="inline-block mr-[0.3em]"
                                            variants={wordReveal}
                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                        >
                                            {word}
                                        </motion.span>
                                    ))}
                                </span>
                            ))}
                        </motion.h1>

                        {/* Subtext */}
                        <motion.p
                            className="max-w-2xl mx-auto text-lg text-text-secondary mb-12 leading-relaxed"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 1.2 }}
                        >
                            {c.hero.sub}
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 1.5 }}
                        >
                            <Link
                                href="/executive"
                                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#8B5CF6] text-white font-semibold hover:bg-[#7C3AED] transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] active:scale-95"
                            >
                                {c.hero.ctaDemo} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/tutorial"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-text-secondary hover:text-white hover:border-white/25 transition-all font-medium"
                            >
                                {c.hero.ctaTour}
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Scroll chevron */}
                    <motion.div
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-tertiary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                    >
                        <span className="text-[10px] uppercase font-mono tracking-widest">{c.hero.scroll}</span>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <ChevronDown className="w-4 h-4" />
                        </motion.div>
                    </motion.div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    2. PROBLEM — Cards Dealt from Alternating Sides
                   ═══════════════════════════════════════════════════════════ */}
                <section className="py-40 px-6 relative overflow-hidden border-t border-white/5">
                    {/* Background blobs */}
                    <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-[#E11D48]/[0.06] rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-[#F59E0B]/[0.06] rounded-full blur-[150px] -z-10 pointer-events-none" />

                    <div className="max-w-6xl mx-auto">
                        {/* Section header */}
                        <motion.div
                            className="max-w-3xl mb-20"
                            variants={fadeInUp}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-100px' }}
                        >
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
                        </motion.div>

                        {/* Cards — dealt from alternating sides */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-50px' }}
                        >
                            {c.problem.items.map((item, i) => (
                                <motion.div
                                    key={item.title}
                                    variants={i % 2 === 0 ? cardFromLeft : cardFromRight}
                                    className="p-8 rounded-2xl backdrop-blur-sm bg-white/[0.03] border border-white/[0.06] border-l-[3px] border-l-[#E11D48]/60"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[#E11D48]/10 border border-[#E11D48]/20 mb-6 flex items-center justify-center">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                                    </div>
                                    <h3 className="text-base font-display font-semibold text-white mb-3">{item.title}</h3>
                                    <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    3. HOW IT WORKS — Scroll-Linked Pipeline
                   ═══════════════════════════════════════════════════════════ */}
                <section ref={pipelineRef} className="py-40 px-6 relative border-t border-white/5">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0EA5E9]/[0.05] rounded-full blur-[150px] -z-10 pointer-events-none" />

                    <div className="max-w-6xl mx-auto">
                        {/* Section header */}
                        <motion.div
                            className="text-center mb-20"
                            variants={fadeInUp}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-100px' }}
                        >
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
                        </motion.div>

                        {/* Pipeline: timeline left, steps right */}
                        <div className="relative max-w-3xl mx-auto">
                            {/* Animated vertical line */}
                            <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-white/[0.06]">
                                <motion.div
                                    className="w-full origin-top rounded-full"
                                    style={{
                                        height: lineHeight,
                                        background: 'linear-gradient(to bottom, #8B5CF6, #0EA5E9)',
                                    }}
                                />
                            </div>

                            {/* Step nodes */}
                            <div className="space-y-16">
                                {c.howItWorks.steps.map((step, i) => (
                                    <motion.div
                                        key={step.step}
                                        className="flex gap-8 items-start relative"
                                        style={{ opacity: stepOpacities[i] }}
                                    >
                                        {/* Node dot */}
                                        <div className="relative z-10 shrink-0 w-12 h-12 rounded-full bg-bg-base border-2 border-[#0EA5E9]/40 flex items-center justify-center">
                                            <span className="text-sm font-mono font-bold text-[#0EA5E9]">{step.step}</span>
                                        </div>
                                        {/* Step content */}
                                        <div className="flex-1 pb-4">
                                            <h3 className="text-lg font-display font-semibold text-white mb-3">{step.title}</h3>
                                            <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    4. SCIENCE — 3D Tilt Cards with Colour Glow
                   ═══════════════════════════════════════════════════════════ */}
                <section className="py-40 px-6 relative border-t border-white/5 overflow-hidden">
                    <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#10B981]/[0.04] rounded-full blur-[150px] -z-10 pointer-events-none" />

                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            className="text-center mb-20"
                            variants={fadeInUp}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-100px' }}
                        >
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
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-50px' }}
                        >
                            {c.science.pillars.map((pillar, i) => {
                                const colors = ['#8B5CF6', '#0EA5E9', '#10B981'];
                                const icons = [
                                    <Brain key="brain" className="w-8 h-8" style={{ color: colors[i] }} />,
                                    <Activity key="activity" className="w-8 h-8" style={{ color: colors[i] }} />,
                                    <Zap key="zap" className="w-8 h-8" style={{ color: colors[i] }} />,
                                ];

                                return (
                                    <motion.div key={pillar.title} variants={fadeInUp}>
                                        <TiltCard glowColor={colors[i]}>
                                            <div className="p-8 rounded-2xl backdrop-blur-sm bg-white/[0.03] border border-white/[0.06] h-full transition-colors duration-300 hover:border-white/[0.12]">
                                                <div className="mb-6">{icons[i]}</div>
                                                <h3 className="text-lg font-display font-bold text-white mb-4">{pillar.title}</h3>
                                                <p className="text-text-secondary text-sm leading-relaxed">{pillar.desc}</p>
                                            </div>
                                        </TiltCard>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    5. ROLE DEMOS — Demo CTA + Tutorial Grid
                   ═══════════════════════════════════════════════════════════ */}
                <section className="py-40 px-6 border-t border-white/5 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#8B5CF6]/[0.04] rounded-full blur-[180px] -z-10 pointer-events-none" />

                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            className="text-center mb-16"
                            variants={fadeInUp}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-100px' }}
                        >
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
                        </motion.div>

                        {/* Demo Dashboard CTA — heroic card */}
                        <motion.div
                            className="mb-12"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                            <Link href="/executive" className="group block">
                                <div className="relative p-1 rounded-2xl bg-gradient-to-r from-[#8B5CF6]/40 via-[#0EA5E9]/20 to-[#8B5CF6]/40 hover:from-[#8B5CF6]/60 hover:via-[#0EA5E9]/30 hover:to-[#8B5CF6]/60 transition-all duration-500">
                                    <div className="absolute inset-0 bg-[#8B5CF6]/20 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-500 rounded-2xl pointer-events-none" />
                                    <div className="relative bg-[#050505] rounded-xl p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center shrink-0">
                                                <Activity className="w-7 h-7 text-[#8B5CF6]" />
                                            </div>
                                            <div>
                                                <p className="text-white font-display font-semibold text-lg mb-1">{c.roleDemos.demoCta}</p>
                                                <p className="text-text-tertiary text-sm font-mono">Executive Dashboard · Synthetic Data · Full Interaction</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#8B5CF6] font-semibold shrink-0">
                                            {c.roleDemos.demoSub} <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>

                        {/* Tutorial cards — 2×2 grid */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-50px' }}
                        >
                            {c.roleDemos.tracks.map(track => (
                                <motion.div key={track.role} variants={fadeInUp}>
                                    <Link href={track.href} className="group block h-full">
                                        <div className="relative h-full rounded-2xl backdrop-blur-sm bg-white/[0.03] border border-white/[0.06] p-8 transition-all duration-300 overflow-hidden hover:border-white/[0.12]">
                                            <div
                                                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] -z-0 opacity-15 group-hover:opacity-30 transition-opacity"
                                                style={{ backgroundColor: track.color }}
                                            />
                                            <div className="relative z-10">
                                                <motion.div
                                                    className="mb-6"
                                                    style={{ color: track.color }}
                                                    whileHover={{ scale: 1.15 }}
                                                    transition={{ type: 'spring', stiffness: 300 }}
                                                >
                                                    {trackIcons[track.role]}
                                                </motion.div>
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
                                                    {c.roleDemos.tourCta} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    6. PRICING — Cinematic Focus Entrance
                   ═══════════════════════════════════════════════════════════ */}
                <section ref={pricingRef} className="py-40 px-6 border-t border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)] -z-10 pointer-events-none" />

                    <motion.div
                        className="max-w-3xl mx-auto text-center"
                        style={{
                            scale: pricingScale,
                            filter: useTransform(pricingBlur, v => `blur(${v}px)`),
                        }}
                    >
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
                                className="group inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-white text-bg-base font-semibold text-lg hover:bg-white/90 transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-95"
                            >
                                <Mail className="w-5 h-5" />
                                {c.pricing.cta}
                            </a>
                            <p className="text-xs text-text-tertiary font-mono">{c.pricing.note}</p>
                        </div>
                    </motion.div>
                </section>

            </main>

            {/* ═══════════════════════════════════════════════════════════════
                FOOTER
               ═══════════════════════════════════════════════════════════════ */}
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

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
    return (
        <LanguageProvider>
            <LandingPageInner />
        </LanguageProvider>
    );
}

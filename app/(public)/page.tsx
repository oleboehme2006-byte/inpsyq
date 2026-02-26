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

// ─────────────────────────────────────────────────────────────────────────────
// Animation Variants
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
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

const cardRise = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 100 } },
};

const wordReveal = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};

const singleWord = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3D Tilt Card Component
// ─────────────────────────────────────────────────────────────────────────────

function TiltCard({ children, glowColor, className }: {
    children: React.ReactNode;
    glowColor: string;
    className?: string;
}) {
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            className={className}
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
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        >
            <div
                className="h-full rounded-2xl p-8 backdrop-blur-sm bg-white/[0.03] border transition-all duration-300"
                style={{
                    borderColor: isHovered ? glowColor + '60' : 'rgba(255,255,255,0.06)',
                    boxShadow: isHovered ? `0 0 30px ${glowColor}20, 0 0 60px ${glowColor}10` : 'none',
                }}
            >
                {children}
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner Page (consumes LanguageProvider context)
// ─────────────────────────────────────────────────────────────────────────────

function LandingPageInner() {
    const { lang, setLang } = useLanguage();
    const c = content[lang];

    // Global scroll tracking
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    // Hero parallax
    const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.92]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
    const orbY1 = useTransform(scrollYProgress, [0, 0.3], [0, -200]);
    const orbY2 = useTransform(scrollYProgress, [0, 0.3], [0, -120]);
    const orbY3 = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

    // Background hue morph
    const bgColor = useTransform(
        scrollYProgress,
        [0, 0.2, 0.45, 0.7, 1],
        [
            'rgba(0,0,0,1)',
            'rgba(20,1,5,1)',
            'rgba(1,8,18,1)',
            'rgba(2,10,5,1)',
            'rgba(0,0,0,1)',
        ]
    );

    // How It Works section scroll-linked pipeline
    const pipelineRef = useRef(null);
    const { scrollYProgress: pipelineProgress } = useScroll({
        target: pipelineRef,
        offset: ['start end', 'end start'],
    });
    const lineHeight = useTransform(pipelineProgress, [0.1, 0.7], ['0%', '100%']);
    const step1Op = useTransform(pipelineProgress, [0.1, 0.2], [0, 1]);
    const step2Op = useTransform(pipelineProgress, [0.25, 0.35], [0, 1]);
    const step3Op = useTransform(pipelineProgress, [0.4, 0.5], [0, 1]);
    const step4Op = useTransform(pipelineProgress, [0.55, 0.65], [0, 1]);
    const stepOpacities = [step1Op, step2Op, step3Op, step4Op];

    // Pricing cinematic
    const pricingRef = useRef(null);
    const { scrollYProgress: pricingProgress } = useScroll({
        target: pricingRef,
        offset: ['start end', 'end start'],
    });
    const pricingScale = useTransform(pricingProgress, [0.2, 0.5], [0.85, 1]);
    const pricingBlur = useTransform(pricingProgress, [0.2, 0.5], [4, 0]);

    const trackIcons: Record<string, React.ReactNode> = {
        EXECUTIVE: <Activity className="w-6 h-6" />,
        TEAMLEAD: <LayoutDashboard className="w-6 h-6" />,
        EMPLOYEE: <UserCheck className="w-6 h-6" />,
        ADMIN: <Settings2 className="w-6 h-6" />,
    };

    // Split headline into words for word-by-word reveal
    const heroWords = c.hero.headline.split(/(\s+|\n)/);

    return (
        <motion.div
            className="min-h-screen text-text-primary flex flex-col font-body selection:bg-accent-primary/30 overflow-x-hidden relative"
            style={{ backgroundColor: bgColor }}
        >
            {/* ── Scroll Progress Bar ── */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left"
                style={{
                    scaleX,
                    background: 'linear-gradient(90deg, #8B5CF6, #0EA5E9, #10B981)',
                }}
            />

            {/* ── Navigation ── */}
            <nav className="w-full border-b border-white/5 bg-black/60 backdrop-blur-xl fixed top-0 z-50 transition-all">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <InPsyqLogo size="sm" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setLang(lang === 'EN' ? 'DE' : 'EN')}
                            className="px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-text-secondary hover:text-white hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/10 transition-all"
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

                {/* ══════════════════════════════════════════════════
                    1. HERO — Staggered Type + Parallax Orbs
                   ══════════════════════════════════════════════════ */}
                <section className="relative min-h-[95vh] px-6 flex flex-col items-center justify-center text-center overflow-hidden">
                    {/* Parallax orbs */}
                    <motion.div
                        className="absolute w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none"
                        style={{ y: orbY1, top: '20%', left: '15%', backgroundColor: '#E11D48', opacity: 0.15 }}
                    />
                    <motion.div
                        className="absolute w-[250px] h-[250px] rounded-full blur-[100px] pointer-events-none"
                        style={{ y: orbY2, top: '30%', right: '10%', backgroundColor: '#0EA5E9', opacity: 0.12 }}
                    />
                    <motion.div
                        className="absolute w-[200px] h-[200px] rounded-full blur-[80px] pointer-events-none"
                        style={{ y: orbY3, bottom: '25%', left: '50%', backgroundColor: '#F59E0B', opacity: 0.1 }}
                    />

                    <motion.div style={{ scale: heroScale, opacity: heroOpacity }} className="relative z-10 flex flex-col items-center">
                        {/* Logo */}
                        <motion.div
                            className="mb-10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6 }}
                        >
                            <InPsyqLogo size="lg" />
                        </motion.div>

                        {/* Headline — word by word */}
                        <motion.h1
                            className="max-w-5xl text-5xl md:text-7xl font-display font-bold text-white tracking-tight mb-8 whitespace-pre-line leading-tight"
                            variants={wordReveal}
                            initial="hidden"
                            animate="show"
                        >
                            {heroWords.map((word, i) =>
                                word === '\n' ? (
                                    <br key={i} />
                                ) : word.trim() === '' ? (
                                    <span key={i}> </span>
                                ) : (
                                    <motion.span key={i} className="inline-block mr-[0.3em]" variants={singleWord}>
                                        {word}
                                    </motion.span>
                                )
                            )}
                        </motion.h1>

                        {/* Subtext */}
                        <motion.p
                            className="max-w-2xl text-lg text-text-secondary mb-12 leading-relaxed"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                        >
                            {c.hero.sub}
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            className="flex flex-col sm:flex-row items-center gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.1, duration: 0.5 }}
                        >
                            <Link
                                href="/executive"
                                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#8B5CF6] text-white font-semibold hover:bg-[#7C3AED] transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] active:scale-95"
                            >
                                {c.hero.ctaPrimary}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/tutorial"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-text-secondary hover:text-white hover:border-white/25 transition-all font-medium"
                            >
                                {c.hero.ctaSecondary}
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-tertiary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 0.5 }}
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

                {/* ══════════════════════════════════════════════════
                    2. PROBLEM — Cards dealt from alternating sides
                   ══════════════════════════════════════════════════ */}
                <section className="py-40 px-6 relative overflow-hidden border-t border-white/5">
                    <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-[#E11D48]/[0.08] rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-[#F59E0B]/[0.06] rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            className="max-w-3xl mb-20"
                            variants={fadeUp}
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

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-80px' }}
                        >
                            {c.problem.items.map((item, i) => (
                                <motion.div
                                    key={item.title}
                                    variants={i % 2 === 0 ? cardFromLeft : cardFromRight}
                                    className="rounded-2xl p-8 backdrop-blur-sm bg-white/[0.03] border border-white/[0.06] border-l-[3px] border-l-[#E11D48]/60"
                                >
                                    <h3 className="text-base font-display font-semibold text-white mb-3">{item.title}</h3>
                                    <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════
                    3. HOW IT WORKS — Scroll-linked pipeline drawing
                   ══════════════════════════════════════════════════ */}
                <section ref={pipelineRef} className="py-40 px-6 relative border-t border-white/5 min-h-[120vh]">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0EA5E9]/[0.05] rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            className="text-center mb-20"
                            variants={fadeUp}
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

                        {/* Pipeline */}
                        <div className="relative max-w-3xl mx-auto">
                            {/* Animated line */}
                            <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-white/5">
                                <motion.div
                                    className="w-full origin-top"
                                    style={{
                                        height: lineHeight,
                                        background: 'linear-gradient(180deg, #8B5CF6, #0EA5E9)',
                                    }}
                                />
                            </div>

                            {/* Steps */}
                            <div className="space-y-16">
                                {c.howItWorks.steps.map((step, i) => (
                                    <motion.div
                                        key={step.step}
                                        className="relative pl-20"
                                        style={{ opacity: stepOpacities[i] }}
                                    >
                                        {/* Node */}
                                        <div className="absolute left-[22px] top-2 w-[14px] h-[14px] rounded-full border-2 border-[#0EA5E9] bg-black">
                                            <div className="absolute inset-0 rounded-full bg-[#0EA5E9]/30 animate-ping" />
                                        </div>

                                        {/* Watermark number */}
                                        <span className="absolute -left-2 -top-6 text-8xl font-display font-bold text-white/[0.03] select-none pointer-events-none">
                                            {step.step}
                                        </span>

                                        <div className="rounded-2xl p-6 backdrop-blur-sm bg-white/[0.02] border border-white/[0.06]">
                                            <h3 className="text-lg font-display font-semibold text-white mb-3">{step.title}</h3>
                                            <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════
                    4. SCIENCE — 3D Tilt Cards with colour-coded glow
                   ══════════════════════════════════════════════════ */}
                <section className="py-40 px-6 relative border-t border-white/5 overflow-hidden">
                    <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#10B981]/[0.04] rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            className="text-center mb-20"
                            variants={fadeUp}
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
                            viewport={{ once: true, margin: '-80px' }}
                        >
                            {c.science.pillars.map((pillar, i) => {
                                const icons = [
                                    <Brain key="brain" className="w-8 h-8" style={{ color: pillar.color }} />,
                                    <Activity key="activity" className="w-8 h-8" style={{ color: pillar.color }} />,
                                    <Zap key="zap" className="w-8 h-8" style={{ color: pillar.color }} />,
                                ];
                                return (
                                    <motion.div key={pillar.title} variants={cardRise}>
                                        <TiltCard glowColor={pillar.color}>
                                            <div className="mb-6">{icons[i]}</div>
                                            <h3 className="text-lg font-display font-bold text-white mb-4">{pillar.title}</h3>
                                            <p className="text-text-secondary text-sm leading-relaxed">{pillar.desc}</p>
                                        </TiltCard>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════
                    5. ROLE DEMOS — Demo CTA + Tutorial Cards
                   ══════════════════════════════════════════════════ */}
                <section className="py-40 px-6 border-t border-white/5 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8B5CF6]/[0.04] rounded-full blur-[200px] -z-10 pointer-events-none" />
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            className="text-center mb-16"
                            variants={fadeUp}
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

                        {/* Demo Dashboard CTA */}
                        <motion.div
                            className="mb-12"
                            initial={{ opacity: 0, scale: 0.85 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                        >
                            <Link href="/executive" className="group block">
                                <div className="relative rounded-2xl p-10 backdrop-blur-sm bg-white/[0.02] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/60 transition-all duration-500 overflow-hidden text-center">
                                    <div className="absolute inset-0 bg-[#8B5CF6]/[0.04] group-hover:bg-[#8B5CF6]/[0.08] transition-colors duration-500" />
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#8B5CF6]/10 rounded-full blur-[80px] pointer-events-none" />
                                    <div className="relative z-10">
                                        <Activity className="w-10 h-10 text-[#8B5CF6] mx-auto mb-4" />
                                        <h3 className="text-2xl font-display font-bold text-white mb-3">{c.roleDemos.demoHeadline}</h3>
                                        <p className="text-text-secondary mb-6 max-w-xl mx-auto">{c.roleDemos.demoSub}</p>
                                        <span className="inline-flex items-center gap-2 text-[#8B5CF6] font-semibold group-hover:gap-3 transition-all">
                                            {c.roleDemos.demoCta} <ArrowRight className="w-5 h-5" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>

                        {/* Tutorial Cards */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-60px' }}
                        >
                            {c.roleDemos.tracks.map(track => (
                                <motion.div key={track.role} variants={cardRise}>
                                    <Link href={track.href} className="group block h-full">
                                        <div
                                            className="relative h-full rounded-2xl backdrop-blur-sm bg-white/[0.02] border border-white/[0.06] p-8 transition-all duration-300 overflow-hidden hover:border-opacity-50"
                                            style={{ ['--tc' as string]: track.color }}
                                        >
                                            <div
                                                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] -z-0 opacity-15 group-hover:opacity-30 transition-opacity duration-500"
                                                style={{ backgroundColor: track.color }}
                                            />
                                            <div className="relative z-10">
                                                <motion.div
                                                    className="mb-5"
                                                    style={{ color: track.color }}
                                                    whileHover={{ scale: 1.15, rotate: 5 }}
                                                    transition={{ type: 'spring', damping: 15 }}
                                                >
                                                    {trackIcons[track.role]}
                                                </motion.div>
                                                <div
                                                    className="text-[10px] font-mono uppercase tracking-widest mb-2"
                                                    style={{ color: track.color }}
                                                >
                                                    {track.role}
                                                </div>
                                                <h3 className="text-xl font-display font-bold text-white mb-3">{track.title}</h3>
                                                <p className="text-text-secondary text-sm leading-relaxed mb-5">{track.desc}</p>
                                                <span
                                                    className="text-xs font-mono flex items-center gap-1 group-hover:gap-2 transition-all"
                                                    style={{ color: track.color }}
                                                >
                                                    {track.cta}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════
                    6. PRICING — Cinematic zoom entrance
                   ══════════════════════════════════════════════════ */}
                <section ref={pricingRef} className="py-40 px-6 border-t border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.04),transparent_70%)] -z-10 pointer-events-none" />
                    <motion.div
                        className="max-w-3xl mx-auto text-center"
                        style={{
                            scale: pricingScale,
                            filter: useTransform(pricingBlur, (v) => `blur(${v}px)`),
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
                                className="group inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-white text-black font-semibold text-lg hover:bg-white/90 transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-95"
                            >
                                <Mail className="w-5 h-5" />
                                {c.pricing.cta}
                            </a>
                            <p className="text-xs text-text-tertiary font-mono">{c.pricing.note}</p>
                        </div>
                    </motion.div>
                </section>

            </main>

            {/* ── Footer ── */}
            <footer className="border-t border-white/5 py-10 px-6 relative z-10 bg-black">
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
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
    return (
        <LanguageProvider>
            <LandingPageInner />
        </LanguageProvider>
    );
}

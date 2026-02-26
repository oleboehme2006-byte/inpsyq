'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useMotionTemplate,
    useInView,
} from 'framer-motion';
import {
    Activity,
    Brain,
    Zap,
    FlaskConical,
    UserCheck,
    Settings2,
    LayoutDashboard,
    Mail,
    ArrowRight,
    ChevronDown,
} from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { InPsyqLogo } from '@/components/shared/InPsyqLogo';
import { LanguageProvider, useLanguage } from '@/hooks/useLanguage';
import { content } from '@/lib/landing/content';

// ─────────────────────────────────────────────────────────────────────────────
// CountUp — counts from 0 to `to` when entering viewport
// ─────────────────────────────────────────────────────────────────────────────
function CountUp({ to, suffix }: { to: number; suffix: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });
    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = to / 40;
        const timer = setInterval(() => {
            start += step;
            if (start >= to) { setCount(to); clearInterval(timer); return; }
            setCount(Math.floor(start));
        }, 30);
        return () => clearInterval(timer);
    }, [inView, to]);
    return <span ref={ref}>{count}{suffix}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rotating dimension ring — decorative atmospheric background for Science
// ─────────────────────────────────────────────────────────────────────────────
const DIMENSIONS = ['STRAIN', 'WITHDRAWAL', 'TRUST GAP', 'ENGAGEMENT', 'AUTONOMY', 'ROLE CLARITY', 'SAFETY', 'WORKLOAD', 'DEPENDENCY', 'BELONGING'];

// ─────────────────────────────────────────────────────────────────────────────
// ScienceCard — isolated for tilt state, now with accentColor
// ─────────────────────────────────────────────────────────────────────────────
function ScienceCard({
    pillar,
    icon,
    hoverClass,
    accentColor,
}: {
    pillar: { title: string; desc: string };
    icon: React.ReactNode;
    hoverClass: string;
    accentColor: string;
}) {
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 50 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
        >
            <div
                onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    setTilt({ rotateX: y * -10, rotateY: x * 10 });
                }}
                onMouseLeave={() => setTilt({ rotateX: 0, rotateY: 0 })}
                style={{
                    transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                    transition: 'transform 0.3s ease-out',
                    borderTop: `2px solid ${accentColor}`,
                }}
                className={`rounded-2xl bg-[#050505] border border-white/8 h-full cursor-default overflow-hidden ${hoverClass}`}
            >
                <div className="p-8">
                    <div className="mb-6">{icon}</div>
                    <h3 className="text-xl font-display font-semibold mb-4" style={{ color: accentColor }}>{pillar.title}</h3>
                    <p className="text-base font-body text-text-secondary leading-relaxed">{pillar.desc}</p>
                </div>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner page (needs the LanguageProvider context)
// ─────────────────────────────────────────────────────────────────────────────
function LandingPageInner() {
    const { lang, setLang } = useLanguage();
    const c = content[lang];

    // ── Global scroll ──────────────────────────────────────────────────────────
    const { scrollYProgress } = useScroll();

    // Scroll progress bar — smoothed with spring
    const scrollBarScaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    // Background tint overlay
    const bgTint = useTransform(
        scrollYProgress,
        [0, 0.2, 0.5, 1],
        [
            'rgba(0,0,0,0)',
            'rgba(225,29,72,0.03)',
            'rgba(14,165,233,0.03)',
            'rgba(0,0,0,0)',
        ]
    );

    // ── Hero parallax ──────────────────────────────────────────────────────────
    const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.92]);
    const heroOpacity = useTransform(scrollYProgress, [0.05, 0.15], [1, 0]);
    const orbRedY = useTransform(scrollYProgress, [0, 0.3], [0, -200]);
    const orbCyanY = useTransform(scrollYProgress, [0, 0.3], [0, -120]);
    const orbAmberY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

    // ── How It Works section ───────────────────────────────────────────────────
    const howItWorksRef = useRef<HTMLElement>(null);
    const { scrollYProgress: howProgress } = useScroll({
        target: howItWorksRef,
        offset: ['start end', 'end start'],
    });

    const lineHeight = useTransform(howProgress, [0.1, 0.8], ['0%', '100%']);

    const step1Opacity = useTransform(howProgress, [0.1, 0.2], [0, 1]);
    const step1Y = useTransform(howProgress, [0.1, 0.2], [30, 0]);
    const step2Opacity = useTransform(howProgress, [0.25, 0.35], [0, 1]);
    const step2Y = useTransform(howProgress, [0.25, 0.35], [30, 0]);
    const step3Opacity = useTransform(howProgress, [0.4, 0.5], [0, 1]);
    const step3Y = useTransform(howProgress, [0.4, 0.5], [30, 0]);
    const step4Opacity = useTransform(howProgress, [0.55, 0.65], [0, 1]);
    const step4Y = useTransform(howProgress, [0.55, 0.65], [30, 0]);

    const stepOpacities = [step1Opacity, step2Opacity, step3Opacity, step4Opacity];
    const stepYValues = [step1Y, step2Y, step3Y, step4Y];

    // Node border colours animate from faint white → step colour as line reaches each node
    const node1Color = useTransform(howProgress, [0.09, 0.12], ['rgba(255,255,255,0.1)', 'rgba(139,92,246,1)']);
    const node2Color = useTransform(howProgress, [0.33, 0.36], ['rgba(255,255,255,0.1)', 'rgba(14,165,233,1)']);
    const node3Color = useTransform(howProgress, [0.56, 0.59], ['rgba(255,255,255,0.1)', 'rgba(225,29,72,1)']);
    const node4Color = useTransform(howProgress, [0.79, 0.82], ['rgba(255,255,255,0.1)', 'rgba(16,185,129,1)']);
    const nodeColors = [node1Color, node2Color, node3Color, node4Color];
    const nodePositions = ['0%', '33%', '66%', 'calc(100% - 44px)'];

    // Step watermark accent colours match the node colours
    const stepAccents = ['#8B5CF6', '#0EA5E9', '#E11D48', '#10B981'];

    // ── Pricing section ────────────────────────────────────────────────────────
    const pricingRef = useRef<HTMLElement>(null);
    const { scrollYProgress: pricingProgress } = useScroll({
        target: pricingRef,
        offset: ['start end', 'end start'],
    });
    const pricingScale = useTransform(pricingProgress, [0.2, 0.5], [0.85, 1]);
    const blurValue = useTransform(pricingProgress, [0.2, 0.5], [4, 0]);
    const pricingFilter = useMotionTemplate`blur(${blurValue}px)`;

    // ── Icon / meta maps ───────────────────────────────────────────────────────
    const trackIcons: Record<string, React.ReactNode> = {
        EXECUTIVE: <Activity className="w-6 h-6" />,
        TEAMLEAD: <LayoutDashboard className="w-6 h-6" />,
        EMPLOYEE: <UserCheck className="w-6 h-6" />,
        ADMIN: <Settings2 className="w-6 h-6" />,
    };

    const trackSubLabels: Record<string, string> = {
        EXECUTIVE: 'MACRO-LEVEL · SYSTEMIC RISK',
        TEAMLEAD: 'MICRO-LEVEL · CAUSAL DRIVERS',
        EMPLOYEE: 'PSYCHOMETRIC · INSTRUMENT',
        ADMIN: 'DATA GOVERNANCE · PIPELINE',
    };

    const sciencePillarMeta = [
        {
            icon: <Brain className="w-8 h-8 text-[#8B5CF6]" />,
            hoverClass: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all duration-300',
            accentColor: '#8B5CF6',
        },
        {
            icon: <Activity className="w-8 h-8 text-[#0EA5E9]" />,
            hoverClass: 'hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] transition-all duration-300',
            accentColor: '#0EA5E9',
        },
        {
            icon: <Zap className="w-8 h-8 text-[#10B981]" />,
            hoverClass: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300',
            accentColor: '#10B981',
        },
    ];

    // Word-by-word headline — preserve line breaks
    const headlineWords = c.hero.headline
        .split(/(\n)/)
        .flatMap((part) => (part === '\n' ? ['\n'] : part.split(' ')))
        .filter((w) => w !== '');

    return (
        <div className="min-h-screen bg-black text-text-primary flex flex-col font-body selection:bg-accent-primary/30 overflow-x-hidden">

            {/* ── Fixed background tint ── */}
            <motion.div
                className="fixed inset-0 pointer-events-none z-0"
                style={{ backgroundColor: bgTint }}
            />

            {/* ── Scroll progress bar ── */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-[2px] bg-[#8B5CF6] origin-left z-[100]"
                style={{ scaleX: scrollBarScaleX }}
            />

            {/* ── Navigation ── */}
            <nav className="w-full border-b border-white/5 bg-black/80 backdrop-blur-md fixed top-[2px] z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <InPsyqLogo size="sm" />
                    </Link>
                    <div className="flex items-center gap-4">
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

                {/* ── 1. Hero ───────────────────────────────────────────────────── */}
                <section className="relative min-h-screen px-6 flex flex-col items-center justify-center text-center overflow-hidden">

                    {/* Parallax orbs */}
                    <motion.div
                        className="absolute top-1/4 -left-16 w-[300px] h-[300px] rounded-full bg-[#E11D48]/20 blur-[80px] pointer-events-none"
                        style={{ y: orbRedY }}
                    />
                    <motion.div
                        className="absolute top-1/3 -right-8 w-[250px] h-[250px] rounded-full bg-[#0EA5E9]/15 blur-[80px] pointer-events-none"
                        style={{ y: orbCyanY }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 left-1/4 w-[200px] h-[200px] rounded-full bg-[#F59E0B]/15 blur-[80px] pointer-events-none"
                        style={{ y: orbAmberY }}
                    />

                    {/* Content with zoom-out on scroll */}
                    <motion.div
                        className="relative z-10 flex flex-col items-center"
                        style={{ scale: heroScale, opacity: heroOpacity }}
                    >
                        {/* Platform badge */}
                        <motion.div
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[11px] font-mono tracking-[0.15em] text-[#8B5CF6] uppercase mb-10"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
                            PSYCHOMETRIC INTELLIGENCE PLATFORM
                        </motion.div>

                        {/* Word-by-word headline */}
                        <motion.h1
                            className="max-w-5xl text-[5rem] leading-[1.05] md:text-[7rem] font-display font-semibold text-white tracking-tight mb-10"
                            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
                            initial="hidden"
                            animate="show"
                        >
                            {headlineWords.map((word, i) =>
                                word === '\n' ? (
                                    <br key={`br-${i}`} />
                                ) : (
                                    <motion.span
                                        key={`w-${i}`}
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            show: { opacity: 1, y: 0 },
                                        }}
                                        className="inline-block mr-[0.3em]"
                                    >
                                        {word}
                                    </motion.span>
                                )
                            )}
                        </motion.h1>

                        {/* Gut feeling line — prominent white medium */}
                        <motion.p
                            className="text-2xl md:text-3xl font-display font-medium text-white mb-4 max-w-3xl leading-snug"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.0 }}
                        >
                            {c.hero.gutFeeling}
                        </motion.p>

                        {/* Body sub — dimmer */}
                        <motion.p
                            className="text-lg font-body text-text-secondary mb-10 max-w-2xl leading-relaxed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.3 }}
                        >
                            {c.hero.sub}
                        </motion.p>

                        {/* KPI pills */}
                        <motion.div
                            className="flex gap-3 flex-wrap justify-center mb-12"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                        >
                            {[
                                { label: 'STRAIN', value: '73', color: '#E11D48' },
                                { label: 'WITHDRAWAL', value: '41', color: '#F59E0B' },
                                { label: 'TRUST GAP', value: '28', color: '#0EA5E9' },
                                { label: 'ENGAGEMENT', value: '59', color: '#10B981' },
                            ].map(({ label, value, color }) => (
                                <div
                                    key={label}
                                    className="px-4 py-2 rounded-full border text-[11px] font-mono tracking-[0.12em] uppercase"
                                    style={{ color, borderColor: `${color}40`, backgroundColor: `${color}18` }}
                                >
                                    {label} · {value}
                                </div>
                            ))}
                        </motion.div>

                        {/* CTA buttons */}
                        <motion.div
                            className="flex flex-col sm:flex-row items-center gap-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.7 }}
                        >
                            <Link
                                href="/executive"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#8B5CF6] text-white font-semibold hover:bg-[#7C3AED] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all"
                            >
                                Live Demo <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="#roles"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-white font-medium hover:border-white/20 transition-all"
                            >
                                Guided Tours
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Scroll chevron */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-tertiary animate-bounce">
                        <span className="text-[10px] uppercase font-mono tracking-widest">{c.hero.scroll}</span>
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </section>

                {/* ── 2. Problem ───────────────────────────────────────────────── */}
                <section className="py-40 px-6 relative overflow-hidden border-t border-white/5">
                    {/* Gradient blobs */}
                    <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-[#E11D48]/8 rounded-full blur-[150px] pointer-events-none" />
                    <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-[#F59E0B]/8 rounded-full blur-[150px] pointer-events-none" />

                    <div className="max-w-6xl mx-auto">
                        {/* Left-aligned headline area */}
                        <div className="max-w-3xl mb-12">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E11D48]/15 border border-[#E11D48]/30 text-[11px] font-mono tracking-[0.15em] text-[#E11D48] uppercase mb-8">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                                {c.problem.badge}
                            </div>
                            <h2 className="text-5xl md:text-6xl font-display font-semibold tracking-tight mb-6 max-w-4xl">
                                <span className="text-white">You&apos;re treating symptoms.</span><br />
                                <span className="text-[#E11D48]">The cause was invisible.</span>
                            </h2>
                            <p className="text-xl font-body text-text-secondary max-w-2xl leading-relaxed">
                                {c.problem.body}
                            </p>
                        </div>

                        {/* Stat row — count up on enter */}
                        <div className="flex gap-8 mb-16 border-t border-white/5 pt-8">
                            {[
                                { value: 6, suffix: 'wk', label: 'avg signal lag before detection' },
                                { value: 73, suffix: '%', label: 'burnout incidents preceded by 4w+ strain signal' },
                                { value: 0, suffix: '', label: 'of that captured by annual surveys' },
                            ].map(({ value, suffix, label }) => (
                                <div key={label} className="flex-1">
                                    <div className="text-4xl font-display font-bold text-[#E11D48] mb-1">
                                        <CountUp to={value} suffix={suffix} />
                                    </div>
                                    <div className="text-sm font-body text-text-tertiary leading-tight">{label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Cards deal in from alternating sides */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-100px' }}
                        >
                            {c.problem.items.map((item, i) => {
                                const cardStyles = [
                                    {
                                        wrapper: 'bg-[#E11D48]/[0.06] border border-[#E11D48]/20 rounded-2xl p-8',
                                        leftBorder: { borderLeftWidth: '3px', borderLeftColor: '#E11D48' },
                                        dot: 'bg-[#E11D48]',
                                        title: 'text-[#E11D48]',
                                    },
                                    {
                                        wrapper: 'bg-[#F59E0B]/[0.06] border border-[#F59E0B]/20 rounded-2xl p-8',
                                        leftBorder: { borderLeftWidth: '3px', borderLeftColor: '#F59E0B' },
                                        dot: 'bg-[#F59E0B]',
                                        title: 'text-[#F59E0B]',
                                    },
                                    {
                                        wrapper: 'bg-white/[0.03] border border-white/10 rounded-2xl p-8',
                                        leftBorder: { borderLeftWidth: '3px', borderLeftColor: 'rgba(255,255,255,0.3)' },
                                        dot: 'bg-white/50',
                                        title: 'text-white',
                                    },
                                ];
                                const s = cardStyles[i] || cardStyles[2];
                                return (
                                    <motion.div
                                        key={item.title}
                                        custom={i}
                                        variants={{
                                            hidden: (index: number) => ({
                                                x: index === 1 ? 120 : -120,
                                                rotate: index === 1 ? 6 : -6,
                                                opacity: 0,
                                            }),
                                            visible: {
                                                x: 0,
                                                rotate: 0,
                                                opacity: 1,
                                                transition: { type: 'spring', stiffness: 100, damping: 20 },
                                            },
                                        }}
                                        className={s.wrapper}
                                        style={s.leftBorder}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`w-2.5 h-2.5 rounded-full ${s.dot} animate-pulse shrink-0`} />
                                            <h3 className={`text-xl font-display font-semibold ${s.title}`}>{item.title}</h3>
                                        </div>
                                        <p className="text-base font-body text-text-secondary leading-relaxed">{item.desc}</p>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </section>

                {/* ── 3. How It Works ──────────────────────────────────────────── */}
                <section
                    ref={howItWorksRef}
                    className="py-40 px-6 relative border-t border-white/5 min-h-[120vh]"
                >
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0EA5E9]/5 rounded-full blur-[150px] pointer-events-none" />

                    <div className="max-w-6xl mx-auto">
                        {/* Section header */}
                        <div className="text-center mb-20">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0EA5E9]/15 border border-[#0EA5E9]/30 text-[11px] font-mono tracking-[0.15em] text-[#0EA5E9] uppercase mb-8">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-pulse" />
                                {c.howItWorks.badge}
                            </div>
                            <h2 className="text-5xl md:text-6xl font-display font-semibold tracking-tight mb-6">
                                <span className="text-white">From two-minute pulse</span><br />
                                <span className="text-[#0EA5E9]">to Monday briefing.</span>
                            </h2>
                            <p className="text-xl md:text-2xl font-body text-text-secondary leading-relaxed max-w-2xl mx-auto">
                                {c.howItWorks.body}
                            </p>
                        </div>

                        {/* Timeline + step cards */}
                        <div className="grid gap-8" style={{ gridTemplateColumns: '48px 1fr' }}>

                            {/* Left: animated pipeline line */}
                            <div className="relative">
                                {/* Background track */}
                                <div className="absolute left-[21px] top-0 bottom-0 w-[2px] bg-white/5" />
                                {/* Growing gradient line */}
                                <motion.div
                                    className="absolute left-[21px] top-0 w-[2px] rounded-full"
                                    style={{
                                        height: lineHeight,
                                        background: 'linear-gradient(to bottom, #8B5CF6, #0EA5E9)',
                                    }}
                                />
                                {/* Step nodes */}
                                {nodeColors.map((color, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-[44px] h-[44px] rounded-full border-2 bg-black flex items-center justify-center"
                                        style={{
                                            top: nodePositions[i],
                                            left: 0,
                                            borderColor: color,
                                        }}
                                    >
                                        <span className="text-[9px] font-mono text-white/40">{`0${i + 1}`}</span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Right: step cards */}
                            <div className="space-y-12 py-1">
                                {c.howItWorks.steps.map((step, i) => (
                                    <motion.div
                                        key={step.step}
                                        style={{ opacity: stepOpacities[i], y: stepYValues[i] }}
                                        className="relative p-8 rounded-2xl bg-[#050505] border border-white/8 overflow-hidden"
                                    >
                                        {/* Watermark number — per-step colour */}
                                        <span
                                            className="text-[8rem] font-display font-semibold absolute top-2 right-6 leading-none select-none pointer-events-none opacity-[0.06]"
                                            style={{ color: stepAccents[i] }}
                                        >
                                            {step.step}
                                        </span>
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-display font-semibold text-white mb-3">
                                                {step.title}
                                            </h3>
                                            <p className="text-base font-body text-text-secondary leading-relaxed">{step.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 4. Science ───────────────────────────────────────────────── */}
                <section className="py-40 px-6 relative border-t border-white/5 overflow-hidden">
                    <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#10B981]/5 rounded-full blur-[150px] pointer-events-none" />

                    {/* Rotating dimension ring — atmospheric background */}
                    <motion.div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none"
                        style={{ zIndex: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
                    >
                        {DIMENSIONS.map((dim, i) => {
                            const angle = (i / DIMENSIONS.length) * 360;
                            const rad = (angle * Math.PI) / 180;
                            const x = 50 + 47 * Math.cos(rad);
                            const y = 50 + 47 * Math.sin(rad);
                            return (
                                <div
                                    key={dim}
                                    className="absolute text-[10px] font-mono text-[#8B5CF6]/15 whitespace-nowrap"
                                    style={{
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
                                    }}
                                >
                                    {dim}
                                </div>
                            );
                        })}
                    </motion.div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="text-center mb-20">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[11px] font-mono tracking-[0.15em] text-[#10B981] uppercase mb-8">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                                {c.science.badge}
                            </div>
                            <h2 className="text-5xl md:text-6xl font-display font-semibold tracking-tight mb-6">
                                <span className="text-white">Thirty years of research.</span><br />
                                <span className="text-[#10B981]">Operationalised in seven days.</span>
                            </h2>
                            <p className="text-xl md:text-2xl font-body text-text-secondary leading-relaxed max-w-3xl mx-auto">
                                {c.science.body}
                            </p>
                        </div>

                        {/* Rise-in stagger + 3D tilt */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                            variants={{ show: { transition: { staggerChildren: 0.15 } } }}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                        >
                            {c.science.pillars.map((pillar, i) => (
                                <ScienceCard
                                    key={pillar.title}
                                    pillar={pillar}
                                    icon={sciencePillarMeta[i].icon}
                                    hoverClass={sciencePillarMeta[i].hoverClass}
                                    accentColor={sciencePillarMeta[i].accentColor}
                                />
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ── 5. Role Demos ────────────────────────────────────────────── */}
                <section id="roles" className="py-40 px-6 border-t border-white/5 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#8B5CF6]/5 rounded-full blur-[150px] pointer-events-none" />

                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[11px] font-mono tracking-[0.15em] text-[#8B5CF6] uppercase mb-8">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
                                {c.roleDemos.badge}
                            </div>
                            <h2 className="text-5xl md:text-6xl font-display font-semibold tracking-tight mb-6">
                                <span className="text-white">Four roles. Four lenses.</span><br />
                                <span className="text-[#8B5CF6]">One platform.</span>
                            </h2>
                            <p className="text-xl md:text-2xl font-body text-text-secondary max-w-2xl mx-auto">
                                {c.roleDemos.sub}
                            </p>
                        </div>

                        {/* Demo CTA card — scales up on viewport entry */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                            viewport={{ once: true }}
                            className="backdrop-blur-sm bg-white/[0.03] border border-[#8B5CF6]/30 rounded-2xl p-10 shadow-[0_0_60px_rgba(139,92,246,0.2)] mb-8"
                        >
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <p className="text-text-secondary max-w-xl">{c.roleDemos.demoCta}</p>
                                <Link
                                    href="/executive"
                                    className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#8B5CF6] text-white font-medium hover:bg-[#7C3AED] transition-colors whitespace-nowrap"
                                >
                                    {c.roleDemos.demoCtaButton} <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </motion.div>

                        {/* Tutorial cards — cascade with 100ms stagger */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                        >
                            {c.roleDemos.tracks.map((track) => (
                                <motion.div
                                    key={track.role}
                                    variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 } }}
                                >
                                    <Link href={track.href} className="block h-full group">
                                        <div className="relative h-full rounded-2xl bg-[#050505] border border-white/8 p-8 transition-all duration-300 hover:border-white/15 overflow-hidden">
                                            {/* Colour glow */}
                                            <div
                                                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"
                                                style={{ backgroundColor: track.color }}
                                            />
                                            <div className="relative z-10">
                                                {/* Icon — scale pulse on hover */}
                                                <motion.div
                                                    className="mb-4 w-fit"
                                                    style={{ color: track.color }}
                                                    whileHover={{ scale: [1, 1.15, 1] }}
                                                    transition={{ duration: 0.4 }}
                                                >
                                                    {trackIcons[track.role]}
                                                </motion.div>
                                                <div className="mb-1">
                                                    <span
                                                        className="text-[11px] font-mono tracking-[0.15em] uppercase"
                                                        style={{ color: track.color }}
                                                    >
                                                        {track.role}
                                                    </span>
                                                </div>
                                                <div className="mb-3">
                                                    <span
                                                        className="text-[11px] font-mono tracking-[0.15em] uppercase"
                                                        style={{ color: track.color }}
                                                    >
                                                        {trackSubLabels[track.role]}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-display font-semibold text-white mb-3 group-hover:opacity-90 transition-opacity">
                                                    {track.title}
                                                </h3>
                                                <p className="text-base font-body text-text-secondary leading-relaxed mb-6">
                                                    {track.desc}
                                                </p>
                                                <div className="flex items-center gap-2 text-[11px] font-mono tracking-[0.12em]" style={{ color: track.color }}>
                                                    {c.roleDemos.tourCta}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ── 6. Pricing ───────────────────────────────────────────────── */}
                <section ref={pricingRef} className="py-40 px-6 border-t border-white/5 relative">
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03), transparent 70%)' }}
                    />
                    <motion.div style={{ scale: pricingScale }}>
                        <motion.div style={{ filter: pricingFilter }}>
                            <div className="max-w-3xl mx-auto text-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[11px] font-mono tracking-[0.15em] text-[#8B5CF6] uppercase mb-8">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
                                    {c.pricing.badge}
                                </div>
                                <h2 className="text-5xl md:text-6xl font-display font-semibold tracking-tight mb-6">
                                    <span className="text-white">Built for organisations that take</span><br />
                                    <span className="text-[#8B5CF6]">culture seriously.</span>
                                </h2>
                                <p className="text-xl md:text-2xl font-body text-text-secondary leading-relaxed mb-12">
                                    {c.pricing.sub}
                                </p>

                                {/* Stat row */}
                                <div className="flex items-center gap-8 md:gap-16 justify-center mb-12">
                                    {[
                                        { n: 10, label: 'DIMENSIONS' },
                                        { n: 48, label: 'SIGNAL VECTOR' },
                                        { n: 7, label: 'DAY DEPLOY' },
                                    ].map(({ n, label }, i) => (
                                        <React.Fragment key={label}>
                                            {i > 0 && <div className="w-px h-12 bg-white/10" />}
                                            <div className="text-center">
                                                <div className="text-5xl md:text-6xl font-display font-bold text-white">
                                                    <CountUp to={n} suffix="" />
                                                </div>
                                                <div className="text-[11px] font-mono tracking-[0.15em] text-text-tertiary mt-2 uppercase">{label}</div>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>

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
                        </motion.div>
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

'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useMotionTemplate,
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
// Science pillar card — isolated to hold its own tilt state
// ─────────────────────────────────────────────────────────────────────────────
function ScienceCard({
    pillar,
    icon,
    hoverClass,
}: {
    pillar: { title: string; desc: string };
    icon: React.ReactNode;
    hoverClass: string;
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
                }}
                className={`p-8 rounded-2xl bg-[#050505] border border-white/8 h-full cursor-default ${hoverClass}`}
            >
                <div className="mb-6">{icon}</div>
                <h3 className="text-lg font-display font-bold text-white mb-4">{pillar.title}</h3>
                <p className="text-text-secondary text-base leading-relaxed">{pillar.desc}</p>
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

    // Node border colours animate from faint white → cyan as line reaches each node
    const node1Color = useTransform(howProgress, [0.09, 0.12], ['rgba(255,255,255,0.1)', 'rgba(14,165,233,1)']);
    const node2Color = useTransform(howProgress, [0.33, 0.36], ['rgba(255,255,255,0.1)', 'rgba(14,165,233,1)']);
    const node3Color = useTransform(howProgress, [0.56, 0.59], ['rgba(255,255,255,0.1)', 'rgba(14,165,233,1)']);
    const node4Color = useTransform(howProgress, [0.79, 0.82], ['rgba(255,255,255,0.1)', 'rgba(14,165,233,1)']);
    const nodeColors = [node1Color, node2Color, node3Color, node4Color];
    const nodePositions = ['0%', '33%', '66%', 'calc(100% - 44px)'];

    // ── Pricing section ────────────────────────────────────────────────────────
    const pricingRef = useRef<HTMLElement>(null);
    const { scrollYProgress: pricingProgress } = useScroll({
        target: pricingRef,
        offset: ['start end', 'end start'],
    });
    const pricingScale = useTransform(pricingProgress, [0.2, 0.5], [0.85, 1]);
    const blurValue = useTransform(pricingProgress, [0.2, 0.5], [4, 0]);
    const pricingFilter = useMotionTemplate`blur(${blurValue}px)`;

    // ── Icon maps ──────────────────────────────────────────────────────────────
    const trackIcons: Record<string, React.ReactNode> = {
        EXECUTIVE: <Activity className="w-6 h-6" />,
        TEAMLEAD: <LayoutDashboard className="w-6 h-6" />,
        EMPLOYEE: <UserCheck className="w-6 h-6" />,
        ADMIN: <Settings2 className="w-6 h-6" />,
    };

    const sciencePillarMeta = [
        {
            icon: <Brain className="w-8 h-8 text-[#8B5CF6]" />,
            hoverClass: 'hover:border-[#8B5CF6]/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all duration-300',
        },
        {
            icon: <Activity className="w-8 h-8 text-[#0EA5E9]" />,
            hoverClass: 'hover:border-[#0EA5E9]/50 hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] transition-all duration-300',
        },
        {
            icon: <Zap className="w-8 h-8 text-[#10B981]" />,
            hoverClass: 'hover:border-[#10B981]/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300',
        },
    ];

    // Highlight a specific word/phrase in headline text with a colour
    const highlightWord = (text: string, word: string, color: string) => {
        const idx = text.indexOf(word);
        if (idx === -1) return <>{text}</>;
        return (
            <>
                {text.slice(0, idx)}
                <span style={{ color }}>{word}</span>
                {text.slice(idx + word.length)}
            </>
        );
    };

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
                <section className="relative min-h-[90vh] px-6 flex flex-col items-center justify-center text-center overflow-hidden">

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
                        {/* Logo with animated underline reveal */}
                        <div className="relative inline-block mb-10 overflow-visible">
                            <span className="text-3xl font-display font-semibold text-white tracking-tight">
                                inPsyq
                            </span>
                            {/* Static glow underline */}
                            <div className="absolute -bottom-1 left-0 w-full h-1 bg-[#8B5CF6] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                            {/* Black mask that wipes right→left to reveal underline */}
                            <motion.div
                                className="absolute -bottom-1 left-0 w-full h-1 bg-black rounded-full"
                                initial={{ scaleX: 1 }}
                                animate={{ scaleX: 0 }}
                                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                                style={{ transformOrigin: 'right' }}
                            />
                        </div>

                        {/* Word-by-word headline */}
                        <motion.h1
                            className="max-w-3xl text-6xl md:text-8xl font-display font-bold text-white tracking-tight mb-6 leading-tight"
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

                        {/* Subtext — fades in after headline */}
                        <motion.p
                            className="max-w-2xl text-xl md:text-2xl text-text-secondary mb-12 leading-relaxed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                        >
                            {c.hero.sub}
                        </motion.p>

                        {/* CTA buttons */}
                        <motion.div
                            className="flex flex-col sm:flex-row items-center gap-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4 }}
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
                        <div className="max-w-3xl mb-20">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E11D48]/15 border border-[#E11D48]/20 text-xs font-mono text-[#E11D48] mb-8">
                                <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
                                {c.problem.badge}
                            </div>
                            <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight mb-8 whitespace-pre-line">
                                {highlightWord(c.problem.headline, lang === 'EN' ? 'symptoms' : 'Symptome', '#E11D48')}
                            </h2>
                            <p className="text-xl md:text-2xl text-text-secondary leading-relaxed">
                                {c.problem.body}
                            </p>
                        </div>

                        {/* Cards deal in from alternating sides */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-100px' }}
                        >
                            {c.problem.items.map((item, i) => (
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
                                    className="backdrop-blur-sm bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8"
                                    style={{ borderLeftWidth: '3px', borderLeftColor: '#E11D48' }}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] animate-pulse shrink-0" />
                                        <h3 className="text-lg font-display font-semibold text-white">{item.title}</h3>
                                    </div>
                                    <p className="text-text-secondary text-base leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
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
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0EA5E9]/15 border border-[#0EA5E9]/20 text-xs font-mono text-[#0EA5E9] mb-8">
                                <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
                                {c.howItWorks.badge}
                            </div>
                            <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight mb-6 whitespace-pre-line">
                                {highlightWord(c.howItWorks.headline, lang === 'EN' ? 'Monday briefing' : 'Montags-Briefing', '#0EA5E9')}
                            </h2>
                            <p className="text-xl md:text-2xl text-text-secondary leading-relaxed max-w-2xl mx-auto">
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
                                        {/* Watermark number */}
                                        <span className="text-8xl font-display text-white/5 absolute top-4 right-6 leading-none select-none pointer-events-none">
                                            {step.step}
                                        </span>
                                        <div className="relative z-10">
                                            <h3 className="text-lg font-display font-semibold text-white mb-3">
                                                {step.title}
                                            </h3>
                                            <p className="text-text-secondary text-base leading-relaxed">{step.desc}</p>
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

                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-20">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/20 text-xs font-mono text-[#8B5CF6] mb-8">
                                <FlaskConical className="w-3 h-3" />
                                {c.science.badge}
                            </div>
                            <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight mb-6 whitespace-pre-line">
                                {highlightWord(c.science.headline, lang === 'EN' ? 'seven days' : 'sieben Tagen', '#10B981')}
                            </h2>
                            <p className="text-xl md:text-2xl text-text-secondary leading-relaxed max-w-3xl mx-auto">
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
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/20 text-xs font-mono text-[#8B5CF6] mb-8">
                                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                                {c.roleDemos.badge}
                            </div>
                            <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight mb-6 whitespace-pre-line">
                                {c.roleDemos.headline}
                            </h2>
                            <p className="text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto">
                                {c.roleDemos.sub}
                            </p>
                        </div>

                        {/* Demo CTA card — scales up on viewport entry */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                            viewport={{ once: true }}
                            className="backdrop-blur-sm bg-white/[0.03] border border-[#8B5CF6]/30 rounded-2xl p-10 shadow-[0_0_40px_rgba(139,92,246,0.1)] mb-8"
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
                                                    className="mb-6 w-fit"
                                                    style={{ color: track.color }}
                                                    whileHover={{ scale: [1, 1.15, 1] }}
                                                    transition={{ duration: 0.4 }}
                                                >
                                                    {trackIcons[track.role]}
                                                </motion.div>
                                                <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: track.color }}>
                                                    {track.role}
                                                </div>
                                                <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:opacity-90 transition-opacity">
                                                    {track.title}
                                                </h3>
                                                <p className="text-text-secondary text-base leading-relaxed mb-6">
                                                    {track.desc}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs font-mono" style={{ color: track.color }}>
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
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-text-secondary mb-8">
                                    {c.pricing.badge}
                                </div>
                                <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight mb-6 whitespace-pre-line">
                                    {highlightWord(c.pricing.headline, lang === 'EN' ? 'culture' : 'Kultur', '#8B5CF6')}
                                </h2>
                                <p className="text-xl md:text-2xl text-text-secondary leading-relaxed mb-12">
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

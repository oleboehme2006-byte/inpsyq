'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView, MotionValue } from 'framer-motion';
import { Activity, LayoutDashboard, UserCheck, Settings2, ArrowRight, ChevronDown } from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { LanguageProvider, useLanguage } from '@/components/landing/LanguageProvider';
import { LanguageToggle } from '@/components/landing/LanguageToggle';
import { content as contentMap, Lang } from '@/lib/landing/content';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DIMENSIONS = [
    'STRAIN', 'WITHDRAWAL', 'TRUST', 'ENGAGEMENT', 'AUTONOMY',
    'ROLE CLARITY', 'SAFETY', 'WORKLOAD', 'DEPENDENCY', 'BELONGING',
];

// ─── TILTCARD ─────────────────────────────────────────────────────────────────

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({});

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setStyle({
            transform: `perspective(800px) rotateX(${y * -8}deg) rotateY(${x * 8}deg)`,
            transition: 'transform 0.15s ease-out',
        });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setStyle({
            transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)',
            transition: 'transform 0.4s ease-out',
        });
    }, []);

    return (
        <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={style} className={className}>
            {children}
        </div>
    );
}

// ─── COUNTUP ──────────────────────────────────────────────────────────────────

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
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

// ─── ANIMATION SUB-COMPONENTS (hooks-in-map workaround) ──────────────────────

function DimItem({ prog, dim, i }: { prog: MotionValue<number>; dim: string; i: number }) {
    const activateAt = 0.15 + i * 0.04;
    const opacity = useTransform(prog, [activateAt, activateAt + 0.03], [0.15, 1]);
    const scale = useTransform(prog, [activateAt, activateAt + 0.03], [0.5, 1]);

    // First 4 items use their index colours, remaining use purple
    const INDEX_COLORS = ['#E11D48', '#F59E0B', '#0EA5E9', '#10B981'];
    const color = i < 4 ? INDEX_COLORS[i] : '#8B5CF6';

    return (
        <motion.div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3"
            style={{ top: `${8 + i * 8.5}%`, opacity, scale }}
        >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-mono tracking-wider" style={{ color }}>{dim}</span>
        </motion.div>
    );
}

interface DotData {
    id: number;
    randomX: number;
    randomY: number;
    laneX: number;
    sortedY: number;
    color: string;
}

function BayesianDot({ prog, dot }: { prog: MotionValue<number>; dot: DotData }) {
    const x = useTransform(prog, [0.15, 0.35, 0.65, 0.85], [dot.randomX, dot.laneX, dot.laneX, 50]);
    const y = useTransform(prog, [0.15, 0.35, 0.65, 0.85], [dot.randomY, dot.sortedY, dot.sortedY, 50]);
    const bg = useTransform(prog, [0.30, 0.40], ['rgba(255,255,255,0.15)', dot.color]);
    const left = useTransform(x, (v) => `${v}%`);
    const top = useTransform(y, (v) => `${v}%`);
    return (
        <motion.div
            className="absolute w-2 h-2 rounded-full"
            style={{ left, top, backgroundColor: bg }}
        />
    );
}

function DriverNode({ prog, d, i }: { prog: MotionValue<number>; d: string; i: number }) {
    const opacity = useTransform(prog, [0.05 + i * 0.02, 0.10 + i * 0.02], [0, 1]);
    const y = 30 + i * 50;
    return (
        <motion.g style={{ opacity }}>
            <circle cx={50} cy={y} r={4} fill="#52525B" />
            <text x={60} y={y + 4} fontSize="9" fontFamily="monospace" fill="#A1A1AA">{d}</text>
        </motion.g>
    );
}

function DimNode({ prog, i }: { prog: MotionValue<number>; i: number }) {
    const opacity = useTransform(prog, [0.30 + i * 0.02, 0.40 + i * 0.02], [0, 1]);
    const y = 50 + i * 60;
    return (
        <motion.g style={{ opacity }}>
            <circle cx={190} cy={y} r={5} fill="#A1A1AA" />
        </motion.g>
    );
}

function IndexNode({ prog, node, i }: { prog: MotionValue<number>; node: { label: string; color: string }; i: number }) {
    const opacity = useTransform(prog, [0.50 + i * 0.03, 0.58 + i * 0.03], [0, 1]);
    const y = 60 + i * 70;
    return (
        <motion.g style={{ opacity }}>
            <circle cx={340} cy={y} r={8} fill={node.color} />
            <text x={340} y={y + 3} textAnchor="middle" fontSize="8" fontFamily="monospace" fontWeight="bold" fill="white">{node.label}</text>
        </motion.g>
    );
}

function AnimatedEdge({
    prog, x1, y1, x2, y2, activateStart, activateEnd,
}: {
    prog: MotionValue<number>;
    x1: number; y1: number; x2: number; y2: number;
    activateStart: number; activateEnd: number;
}) {
    const dashOffset = useTransform(prog, [activateStart, activateEnd], [200, 0]);
    const opacity = useTransform(prog, [activateStart, activateStart + 0.05], [0, 1]);
    return (
        <motion.line
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#52525B" strokeWidth={0.5} strokeDasharray="200"
            style={{ strokeDashoffset: dashOffset, opacity }}
        />
    );
}

// ─── MAIN LANDING CONTENT ─────────────────────────────────────────────────────

function LandingContent() {
    const { lang } = useLanguage();
    const c = contentMap[lang as Lang] ?? contentMap.EN;

    // Global scroll progress
    const { scrollYProgress } = useScroll();

    // Background orb opacities — sequential, no two bright at once
    const redOpacity = useTransform(scrollYProgress, [0, 0.08, 0.25, 0.35], [0.08, 0.15, 0.15, 0]);
    const redY = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']);
    const amberOpacity = useTransform(scrollYProgress, [0.30, 0.37, 0.50, 0.60], [0, 0.12, 0.12, 0]);
    const amberY = useTransform(scrollYProgress, [0, 1], ['0%', '-10%']);
    const greenOpacity = useTransform(scrollYProgress, [0.55, 0.62, 0.75, 0.85], [0, 0.15, 0.15, 0]);
    const greenY = useTransform(scrollYProgress, [0, 1], ['0%', '-8%']);

    // Hero exit
    const heroScale = useTransform(scrollYProgress, [0, 0.12], [1, 0.92]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
    const heroBlur = useTransform(scrollYProgress, [0, 0.12], [0, 4]);
    const heroFilter = useTransform(heroBlur, (v) => `blur(${v}px)`);

    // Section 5 scroll refs
    const methodologyRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: methProg } = useScroll({ target: methodologyRef, offset: ['start end', 'end start'] });
    const lineHeight = useTransform(methProg, [0.55, 0.80], ['0%', '100%']);

    const algoRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: algoProg } = useScroll({ target: algoRef, offset: ['start end', 'end start'] });

    const synthRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: synthProg } = useScroll({ target: synthRef, offset: ['start end', 'end start'] });
    const briefingOpacity = useTransform(synthProg, [0.60, 0.70], [0, 1]);

    // 5B: 40 Bayesian dots
    const [dots] = useState<DotData[]>(() =>
        Array.from({ length: 40 }, (_, i) => ({
            id: i,
            randomX: Math.random() * 100,
            randomY: Math.random() * 100,
            color: (['#E11D48', '#F59E0B', '#0EA5E9', '#10B981'] as const)[i % 4],
            laneX: 20 + (i % 4) * 20,
            sortedY: 10 + Math.floor(i / 4) * 8,
        }))
    );

    // 5C: Causal graph data
    const driverNodes = ['Workload', 'Role Clarity', 'Dependencies', 'Scope', 'Autonomy', 'Overtime'];
    const dimNodeCount = 5;
    const indexNodes = [
        { label: 'STR', color: '#E11D48' },
        { label: 'WDR', color: '#F59E0B' },
        { label: 'TRU', color: '#0EA5E9' },
        { label: 'ENG', color: '#10B981' },
    ];
    const d2dEdges: Array<[number, number, number, number]> = [
        [30, 50, 0.15, 0.35],
        [30, 170, 0.16, 0.36],
        [80, 110, 0.17, 0.37],
        [80, 230, 0.18, 0.38],
        [130, 170, 0.19, 0.39],
        [130, 290, 0.20, 0.40],
        [180, 50, 0.17, 0.37],
        [230, 110, 0.18, 0.38],
        [280, 50, 0.19, 0.39],
    ];
    const d2iEdges: Array<[number, number, number, number]> = [
        [50, 60, 0.35, 0.55],
        [110, 130, 0.36, 0.56],
        [170, 60, 0.37, 0.57],
        [230, 200, 0.38, 0.58],
        [290, 270, 0.39, 0.59],
        [110, 270, 0.40, 0.60],
        [170, 200, 0.41, 0.61],
    ];

    const dds = c.deepDive.sections;

    return (
        <div className="relative bg-black text-white min-h-screen">
            {/* === SCROLLBAR === */}
            <style jsx global>{`
                ::-webkit-scrollbar { width: 6px; background: transparent; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
            `}</style>

            {/* === BACKGROUND ORBS === */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <motion.div
                    className="absolute w-[80vw] h-[80vh] rounded-full blur-[300px] bg-[#E11D48]"
                    style={{ opacity: redOpacity, top: '10%', left: '10%', y: redY }}
                />
                <motion.div
                    className="absolute w-[80vw] h-[80vh] rounded-full blur-[300px] bg-[#F59E0B]"
                    style={{ opacity: amberOpacity, top: '10%', left: '10%', y: amberY }}
                />
                <motion.div
                    className="absolute w-[80vw] h-[80vh] rounded-full blur-[300px] bg-[#10B981]"
                    style={{ opacity: greenOpacity, top: '10%', left: '10%', y: greenY }}
                />
            </div>

            {/* === FIXED NAV === */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="relative">
                        <span className="text-2xl font-display font-semibold text-white tracking-tight">inPsyq</span>
                        <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#8B5CF6] rounded-full" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <LanguageToggle />
                        <SignedOut>
                            <Link href="/sign-in" className="text-sm font-body text-text-secondary hover:text-white transition-colors">
                                {c.nav.login}
                            </Link>
                        </SignedOut>
                        <SignedIn><UserButton /></SignedIn>
                    </div>
                </div>
            </nav>

            {/* === SECTION 1: HERO === */}
            <motion.section
                className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 z-10"
                style={{ scale: heroScale, opacity: heroOpacity, filter: heroFilter }}
            >
                <h1 className="text-[clamp(3rem,8vw,11rem)] leading-[0.95] font-display font-semibold text-white tracking-tight max-w-[90vw]">
                    {c.hero.headline.split('\n').map((line, li) => (
                        <motion.div
                            key={li}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + li * 0.15, duration: 0.5 }}
                        >
                            {line}
                        </motion.div>
                    ))}
                </h1>

                <motion.div className="absolute bottom-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                    <ChevronDown className="w-5 h-5 text-text-tertiary animate-bounce" />
                </motion.div>
            </motion.section>

            {/* === SECTION 2: GUT FEELING === */}
            <section id="gut-feeling" className="relative z-10 py-32 md:py-48 border-t border-white/5">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-16">
                    <div className="md:col-span-2 md:sticky md:top-[30vh] md:self-start">
                        <h2 className="text-5xl md:text-6xl font-display font-semibold tracking-tight text-white leading-[1.1]">
                            {c.gutFeeling.headline.split('\n').map((line, i) => (
                                <React.Fragment key={i}>
                                    {line}
                                    {i === 0 && <br />}
                                </React.Fragment>
                            ))}
                        </h2>
                    </div>
                    <div className="md:col-span-3 space-y-10">
                        <motion.p
                            className="text-lg font-body text-text-secondary leading-relaxed"
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ duration: 0.5 }}
                        >
                            {c.gutFeeling.p1}
                        </motion.p>
                        <motion.p
                            className="text-lg font-body text-text-secondary leading-relaxed"
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ duration: 0.5 }}
                        >
                            {c.gutFeeling.p2}
                        </motion.p>
                        <motion.p
                            className="text-lg font-body text-white font-medium leading-relaxed"
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ duration: 0.5 }}
                        >
                            {c.gutFeeling.p3}
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* === DIMENSION ORBIT WRAPPER (spans S3 + S4) === */}
            <div className="relative">
                <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] pointer-events-none z-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
                >
                    <svg viewBox="0 0 900 900" className="w-full h-full">
                        <defs>
                            <path
                                id="dimension-circle"
                                d="M 450,450 m -380,0 a 380,380 0 1,1 760,0 a 380,380 0 1,1 -760,0"
                                fill="none"
                            />
                        </defs>
                        <text style={{ fontSize: '11px', letterSpacing: '0.25em', fontFamily: 'monospace' }}>
                            <textPath href="#dimension-circle" fill="rgba(139, 92, 246, 0.15)" startOffset="0%">
                                {'STRAIN · WITHDRAWAL · TRUST · ENGAGEMENT · AUTONOMY · ROLE CLARITY · SAFETY · WORKLOAD · DEPENDENCY · BELONGING · STRAIN · WITHDRAWAL · TRUST · ENGAGEMENT · AUTONOMY · ROLE CLARITY · SAFETY · WORKLOAD · DEPENDENCY · BELONGING · '}
                            </textPath>
                        </text>
                    </svg>
                </motion.div>

                {/* === SECTION 3: THE DEPTH === */}
                <section className="relative z-10 py-32 md:py-48">
                    <div className="max-w-3xl mx-auto px-6 text-center mb-20">
                        <motion.h2
                            className="text-5xl md:text-6xl font-display font-semibold tracking-tight text-white leading-[1.1] mb-8"
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        >
                            {c.depth.headline.split('\n').map((l, i) => (
                                <React.Fragment key={i}>{l}{i === 0 && <br />}</React.Fragment>
                            ))}
                        </motion.h2>
                        <motion.p
                            className="text-lg font-body text-text-secondary leading-relaxed mb-8"
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                        >
                            {c.depth.body}
                        </motion.p>
                        <motion.p
                            className="text-xl font-body text-white font-medium"
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
                        >
                            {c.depth.depthReveal}
                        </motion.p>
                    </div>

                    <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {c.depth.cards.map((card, i) => (
                            <motion.div
                                key={card.label}
                                initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-100px' }}
                                transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.15 }}
                            >
                                <TiltCard className="h-full">
                                    <div
                                        className="relative bg-[#050505] rounded-2xl p-8 h-full overflow-hidden"
                                        style={{ borderLeft: `3px solid ${card.color}` }}
                                    >
                                        <div
                                            className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px]"
                                            style={{ backgroundColor: `${card.color}15` }}
                                        />
                                        <span
                                            className="text-xs font-mono tracking-widest uppercase mb-4 block"
                                            style={{ color: card.color }}
                                        >
                                            {card.label}
                                        </span>
                                        <h3 className="text-xl font-display font-semibold text-white mb-3">{card.title}</h3>
                                        <p className="text-base font-body text-text-secondary leading-relaxed">{card.body}</p>
                                    </div>
                                </TiltCard>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* === SECTION 4: WHAT CHANGES === */}
                <section className="relative z-10 py-32 md:py-48">
                    <div className="max-w-3xl mx-auto px-6">
                        <motion.h2
                            className="text-5xl md:text-6xl font-display font-semibold tracking-tight text-white leading-[1.1] mb-20 text-center"
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        >
                            {c.whatChanges.headline}
                        </motion.h2>
                        <div className="space-y-20">
                            {c.whatChanges.statements.map((stmt, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && <div className="w-16 h-px bg-white/10 mx-auto" />}
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }} transition={{ duration: 0.5 }}
                                    >
                                        <TiltCard className="bg-[#050505] rounded-2xl p-10 text-center">
                                            <h3 className="text-2xl font-display font-semibold text-white mb-4">{stmt.lead}</h3>
                                            <motion.p
                                                className="text-base font-body text-text-secondary leading-relaxed"
                                                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                                                viewport={{ once: true }} transition={{ delay: 0.2 }}
                                            >
                                                {stmt.body}
                                            </motion.p>
                                        </TiltCard>
                                    </motion.div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* === SECTION 5: DEEP DIVE === */}
            <section className="relative z-10 py-32 md:py-48 border-t border-white/5">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-24">
                        <motion.h2
                            className="text-5xl md:text-6xl font-display font-semibold tracking-tight text-white leading-[1.1] mb-6"
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        >
                            {c.deepDive.headline}
                        </motion.h2>
                        <motion.p
                            className="text-lg font-body text-text-secondary"
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        >
                            {c.deepDive.sub}
                        </motion.p>
                    </div>

                    {/* 5A: METHODOLOGY — Signal Pulse */}
                    <div ref={methodologyRef} className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 min-h-[80vh] items-center mb-32">
                        <div className="md:sticky md:top-[25vh] md:self-start h-[500px] relative rounded-2xl overflow-hidden">
                            {DIMENSIONS.map((dim, i) => (
                                <DimItem key={dim} prog={methProg} dim={dim} i={i} />
                            ))}
                            <motion.div
                                className="absolute left-1/2 -translate-x-1/2 w-[1px] top-[8%]"
                                style={{ height: lineHeight, background: 'linear-gradient(to bottom, #8B5CF600, #8B5CF6)' }}
                            />
                        </div>
                        <div>
                            <span
                                className="text-xs font-mono tracking-widest uppercase mb-4 block"
                                style={{ color: dds[0]?.labelColor }}
                            >
                                {dds[0]?.label}
                            </span>
                            <h3 className="text-3xl font-display font-semibold text-white mb-6">{dds[0]?.title}</h3>
                            {dds[0]?.body.split('\n\n').map((para, i) => (
                                <motion.p
                                    key={i}
                                    className="text-base font-body text-text-secondary leading-relaxed mb-6"
                                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                >
                                    {para}
                                </motion.p>
                            ))}
                            <Link
                                href={dds[0]?.linkHref ?? '#'}
                                className="inline-flex items-center gap-2 text-sm font-mono tracking-widest uppercase mt-4 transition-colors hover:text-white"
                                style={{ color: dds[0]?.labelColor }}
                            >
                                Coming soon <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    {/* 5B: ALGORITHMS — Bayesian Convergence */}
                    <div ref={algoRef} className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 min-h-[80vh] items-center mb-32">
                        <div className="md:sticky md:top-[25vh] md:self-start h-[500px] relative rounded-2xl overflow-hidden">
                            {dots.map((dot) => (
                                <BayesianDot key={dot.id} prog={algoProg} dot={dot} />
                            ))}
                        </div>
                        <div>
                            <span
                                className="text-xs font-mono tracking-widest uppercase mb-4 block"
                                style={{ color: dds[1]?.labelColor }}
                            >
                                {dds[1]?.label}
                            </span>
                            <h3 className="text-3xl font-display font-semibold text-white mb-6">{dds[1]?.title}</h3>
                            {dds[1]?.body.split('\n\n').map((para, i) => (
                                <motion.p
                                    key={i}
                                    className="text-base font-body text-text-secondary leading-relaxed mb-6"
                                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                >
                                    {para}
                                </motion.p>
                            ))}
                            <Link
                                href={dds[1]?.linkHref ?? '#'}
                                className="inline-flex items-center gap-2 text-sm font-mono tracking-widest uppercase mt-4 transition-colors hover:text-white"
                                style={{ color: dds[1]?.labelColor }}
                            >
                                Coming soon <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    {/* 5C: PSYCHOLOGY — Causal Network Graph */}
                    <div ref={synthRef} className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 min-h-[80vh] items-center">
                        <div className="md:sticky md:top-[25vh] md:self-start h-[500px] relative rounded-2xl overflow-hidden">
                            <svg viewBox="0 0 400 350" className="w-full h-full">
                                {d2dEdges.map(([y1, y2, aStart, aEnd], i) => (
                                    <AnimatedEdge
                                        key={`d2d-${i}`} prog={synthProg}
                                        x1={50} y1={y1} x2={190} y2={y2}
                                        activateStart={aStart} activateEnd={aEnd}
                                    />
                                ))}
                                {d2iEdges.map(([y1, y2, aStart, aEnd], i) => (
                                    <AnimatedEdge
                                        key={`d2i-${i}`} prog={synthProg}
                                        x1={190} y1={y1} x2={340} y2={y2}
                                        activateStart={aStart} activateEnd={aEnd}
                                    />
                                ))}
                                {driverNodes.map((d, i) => (
                                    <DriverNode key={d} prog={synthProg} d={d} i={i} />
                                ))}
                                {Array.from({ length: dimNodeCount }, (_, i) => (
                                    <DimNode key={i} prog={synthProg} i={i} />
                                ))}
                                {indexNodes.map((node, i) => (
                                    <IndexNode key={node.label} prog={synthProg} node={node} i={i} />
                                ))}
                                <motion.text
                                    x={200} y={340} textAnchor="middle"
                                    fontSize="10" fontFamily="monospace" fill="#8B5CF6"
                                    style={{ opacity: briefingOpacity }}
                                >
                                    BRIEFING GENERATED
                                </motion.text>
                            </svg>
                        </div>
                        <div>
                            <span
                                className="text-xs font-mono tracking-widest uppercase mb-4 block"
                                style={{ color: dds[2]?.labelColor }}
                            >
                                {dds[2]?.label}
                            </span>
                            <h3 className="text-3xl font-display font-semibold text-white mb-6">{dds[2]?.title}</h3>
                            {dds[2]?.body.split('\n\n').map((para, i) => (
                                <motion.p
                                    key={i}
                                    className="text-base font-body text-text-secondary leading-relaxed mb-6"
                                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                >
                                    {para}
                                </motion.p>
                            ))}
                            <Link
                                href={dds[2]?.linkHref ?? '#'}
                                className="inline-flex items-center gap-2 text-sm font-mono tracking-widest uppercase mt-4 transition-colors hover:text-white"
                                style={{ color: dds[2]?.labelColor }}
                            >
                                Coming soon <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* === SECTION 6: EXPERIENCE IT === */}
            <section className="relative z-10 py-32 md:py-48">
                <div className="max-w-5xl mx-auto px-6 space-y-20">

                    {/* Demo CTA */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    >
                        <TiltCard>
                            <Link href="/executive" className="block bg-[#050505] rounded-2xl p-10 border border-[#8B5CF6]/20 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-mono tracking-widest text-text-tertiary uppercase block mb-3">{c.experience.demoLabel}</span>
                                        <h3 className="text-3xl font-display font-semibold text-white mb-2">{c.experience.demoTitle}</h3>
                                        <p className="text-base font-body text-text-secondary">{c.experience.demoSub}</p>
                                    </div>
                                    <ArrowRight className="w-6 h-6 text-[#8B5CF6] flex-shrink-0" />
                                </div>
                            </Link>
                        </TiltCard>
                    </motion.div>

                    {/* Tutorial Hub */}
                    <div>
                        <h2 className="text-3xl md:text-5xl font-display font-bold text-white text-center mb-4">{c.experience.tutorialHeadline}</h2>
                        <p className="text-text-secondary text-center max-w-lg mx-auto mb-12 font-body">{c.experience.tutorialSub}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            {c.experience.tracks.map((track, i) => (
                                <motion.div
                                    key={track.role}
                                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.12 }}
                                >
                                    <Link href={track.href} className="group block h-full">
                                        <div
                                            className="relative h-full rounded-2xl bg-[#050505] border border-white/10 p-8 transition-all duration-300 overflow-hidden"
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = `${track.color}80`;
                                                e.currentTarget.style.backgroundColor = `${track.color}08`;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                                e.currentTarget.style.backgroundColor = '#050505';
                                            }}
                                        >
                                            <div
                                                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px]"
                                                style={{ backgroundColor: `${track.color}15` }}
                                            />
                                            {track.role === 'EXECUTIVE' && <Activity className="w-10 h-10 mb-6" style={{ color: track.color }} />}
                                            {track.role === 'TEAMLEAD' && <LayoutDashboard className="w-10 h-10 mb-6" style={{ color: track.color }} />}
                                            {track.role === 'EMPLOYEE' && <UserCheck className="w-10 h-10 mb-6" style={{ color: track.color }} />}
                                            {track.role === 'ADMIN' && <Settings2 className="w-10 h-10 mb-6" style={{ color: track.color }} />}
                                            <h3 className="text-xl font-display font-bold text-white mb-2">{track.title}</h3>
                                            <p className="text-sm text-text-tertiary font-mono mb-4 uppercase tracking-wider">{track.sub}</p>
                                            <p className="text-text-secondary text-sm leading-relaxed font-body">{track.desc}</p>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* === SECTION 7: CONTACT === */}
            <section className="relative z-10 py-32 md:py-48">
                <motion.div
                    className="max-w-2xl mx-auto px-6 text-center"
                    initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }} transition={{ duration: 0.6 }}
                >
                    <h2 className="text-5xl md:text-6xl font-display font-semibold tracking-tight text-white leading-[1.1] mb-8">
                        {c.contact.headline}
                    </h2>
                    <p className="text-lg font-body text-text-secondary mb-12 leading-relaxed">{c.contact.sub}</p>
                    <a
                        href="mailto:contact@inpsyq.com"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#8B5CF6] text-white font-body font-medium text-base hover:bg-[#7C3AED] transition-colors"
                    >
                        {c.contact.cta}
                    </a>
                    <p className="mt-6 text-xs font-mono text-text-tertiary tracking-widest uppercase">{c.contact.note}</p>
                </motion.div>
            </section>

            {/* === FOOTER === */}
            <footer className="relative z-10 border-t border-white/5 py-8">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-text-tertiary">
                    <span>{c.footer.rights}</span>
                    <div className="flex gap-6">
                        <span>{c.footer.privacy}</span>
                        <span>{c.footer.terms}</span>
                        <span>{c.footer.imprint}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function LandingPage() {
    return (
        <LanguageProvider>
            <LandingContent />
        </LanguageProvider>
    );
}

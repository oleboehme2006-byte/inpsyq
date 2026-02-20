import Link from 'next/link';
import { ArrowRight, Activity, ShieldCheck, Zap, BarChart3, Brain, Users, ChevronRight } from 'lucide-react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { InPsyqLogo } from '@/components/shared/InPsyqLogo';
import { LoadingScreen } from '@/components/public/LoadingScreen';

export const metadata = {
    title: 'inPsyq — Organizational Health, Quantified',
    description: 'The first AI-native platform for detecting burnout, engagement gaps, and systemic drivers before they impact delivery.',
};

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-bg-base flex flex-col font-body selection:bg-accent-primary/30 overflow-hidden">
            <LoadingScreen />

            {/* ================================================================
                NAVIGATION
                ================================================================ */}
            <nav className="w-full border-b border-white/5 bg-bg-base/80 backdrop-blur-md fixed top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/">
                        <InPsyqLogo size="sm" />
                    </Link>
                    <div className="flex items-center gap-6">
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
                            href="/executive"
                            className="px-5 py-2 rounded-lg bg-[#8B5CF6] text-white text-sm font-medium hover:bg-[#7C3AED] transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                        >
                            View Demo
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex flex-col">

                {/* ================================================================
                    HERO SECTION
                    ================================================================ */}
                <section className="relative pt-32 pb-20 px-6 flex flex-col items-center text-center">
                    {/* Background Effects */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#8B5CF6]/15 rounded-full blur-[150px] -z-10 pointer-events-none" />
                    <div className="absolute top-[200px] right-[20%] w-[300px] h-[300px] bg-[#06B6D4]/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

                    {/* Live Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bg-elevated border border-white/10 text-xs font-mono text-[#8B5CF6] mb-8 animate-in fade-in duration-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                        </span>
                        LIVE DEMO AVAILABLE
                    </div>

                    {/* Headline */}
                    <h1 className="max-w-4xl text-5xl md:text-7xl font-display font-bold text-white tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        Organizational health,{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]">
                            quantified in real-time.
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="max-w-2xl text-lg text-text-secondary mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        The first AI-native platform for detecting burnout, engagement gaps, and systemic drivers before they impact delivery.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        <Link
                            href="/executive"
                            className="px-8 py-4 rounded-lg bg-[#8B5CF6] text-white font-medium hover:bg-[#7C3AED] transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] flex items-center gap-2"
                        >
                            Enter Executive Demo <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/measure"
                            className="px-8 py-4 rounded-lg bg-bg-elevated border border-white/10 text-white font-medium hover:bg-bg-hover hover:border-white/20 transition-all"
                        >
                            Try Employee Session
                        </Link>
                    </div>

                    {/* Dashboard Preview */}
                    <div className="mt-20 relative w-full max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        {/* Glow border */}
                        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#8B5CF6]/30 via-white/5 to-transparent" />
                        <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.15)]">
                            {/* Fake browser chrome */}
                            <div className="bg-[#0A0A0A] border-b border-white/5 px-4 py-2.5 flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-[#E11D48]/60" />
                                    <div className="w-3 h-3 rounded-full bg-[#F59E0B]/60" />
                                    <div className="w-3 h-3 rounded-full bg-[#10B981]/60" />
                                </div>
                                <div className="flex-1 mx-8">
                                    <div className="bg-bg-base rounded-md px-3 py-1 text-xs font-mono text-text-tertiary text-center max-w-xs mx-auto">
                                        inpsyq.com/executive
                                    </div>
                                </div>
                            </div>
                            {/* Dashboard iframe */}
                            <div className="relative bg-bg-base aspect-[16/9]">
                                <iframe
                                    src="/executive"
                                    className="w-full h-full border-0 pointer-events-none"
                                    title="Executive Dashboard Preview"
                                    loading="lazy"
                                />
                                {/* Interaction overlay with CTA */}
                                <Link
                                    href="/executive"
                                    className="absolute inset-0 bg-gradient-to-t from-bg-base/80 via-transparent to-transparent flex items-end justify-center pb-8 opacity-0 hover:opacity-100 transition-opacity duration-300"
                                >
                                    <span className="px-6 py-3 rounded-lg bg-[#8B5CF6] text-white text-sm font-medium flex items-center gap-2">
                                        Explore Live Dashboard <ChevronRight className="w-4 h-4" />
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================================================================
                    FEATURE TRIPTYCH
                    ================================================================ */}
                <section className="py-24 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-3 block">Capabilities</span>
                            <h2 className="text-3xl md:text-4xl font-display font-semibold text-white tracking-tight">
                                Intelligence, not just metrics
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FeatureCard
                                icon={<Activity className="w-5 h-5" />}
                                iconColor="#E11D48"
                                title="Early Detection"
                                desc="Identify strain patterns weeks before they manifest as attrition or missed deadlines. AI-driven anomaly detection surfaces risks automatically."
                            />
                            <FeatureCard
                                icon={<ShieldCheck className="w-5 h-5" />}
                                iconColor="#0EA5E9"
                                title="Psychological Safety"
                                desc="Measure the unmeasurable. Visualize trust gaps and withdrawal risk with precision using validated psychometric instruments."
                            />
                            <FeatureCard
                                icon={<Zap className="w-5 h-5" />}
                                iconColor="#10B981"
                                title="Actionable Intervention"
                                desc="AI-generated recommendations with causal analysis. Understand not just what is happening, but why — and what to do about it."
                            />
                        </div>
                    </div>
                </section>

                {/* ================================================================
                    HOW IT WORKS
                    ================================================================ */}
                <section className="py-24 px-6 border-t border-white/5">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-[0.2em] mb-3 block">Process</span>
                            <h2 className="text-3xl md:text-4xl font-display font-semibold text-white tracking-tight">
                                Three steps to clarity
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <StepCard
                                step="01"
                                icon={<Users className="w-5 h-5 text-[#8B5CF6]" />}
                                title="Measure"
                                desc="Employees complete a 2-minute weekly check-in with 10 validated psychometric questions. Individual responses are never shared."
                            />
                            <StepCard
                                step="02"
                                icon={<Brain className="w-5 h-5 text-[#06B6D4]" />}
                                title="Analyze"
                                desc="AI aggregates responses into team-level indices, identifies systemic drivers, and generates causal attribution models."
                            />
                            <StepCard
                                step="03"
                                icon={<BarChart3 className="w-5 h-5 text-[#10B981]" />}
                                title="Intervene"
                                desc="Executives and team leads access real-time dashboards with prioritized recommendations and intervention strategies."
                            />
                        </div>
                    </div>
                </section>

                {/* ================================================================
                    CTA SECTION
                    ================================================================ */}
                <section className="py-24 px-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#8B5CF6]/5 to-transparent pointer-events-none" />
                    <div className="max-w-3xl mx-auto text-center relative">
                        <h2 className="text-3xl md:text-4xl font-display font-semibold text-white tracking-tight mb-4">
                            See it in action
                        </h2>
                        <p className="text-text-secondary mb-8 leading-relaxed">
                            Explore the full executive and team dashboards with live mock data.
                            No sign-up required.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/executive"
                                className="px-8 py-4 rounded-lg bg-[#8B5CF6] text-white font-medium hover:bg-[#7C3AED] transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] flex items-center gap-2"
                            >
                                Executive Dashboard <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/team/product"
                                className="px-8 py-4 rounded-lg bg-bg-elevated border border-white/10 text-white font-medium hover:bg-bg-hover hover:border-white/20 transition-all"
                            >
                                Team Dashboard
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* ================================================================
                FOOTER
                ================================================================ */}
            <footer className="border-t border-white/5 py-10 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <InPsyqLogo size="sm" />
                        <span className="text-xs text-text-tertiary">© 2026 inPsyq GmbH. All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-8 text-xs text-text-tertiary">
                        <Link href="/privacy" className="hover:text-text-secondary transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-text-secondary transition-colors">Terms</Link>
                        <Link href="/imprint" className="hover:text-text-secondary transition-colors">Imprint</Link>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="hover:text-text-secondary transition-colors">Log in</button>
                            </SignInButton>
                        </SignedOut>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

function FeatureCard({
    icon,
    iconColor,
    title,
    desc,
}: {
    icon: React.ReactNode;
    iconColor: string;
    title: string;
    desc: string;
}) {
    return (
        <div className="p-8 rounded-2xl bg-[#050505] border border-white/10 hover:border-white/15 transition-all duration-300 group">
            <div
                className="mb-5 p-3 rounded-xl w-fit transition-transform group-hover:scale-110 duration-300"
                style={{ backgroundColor: `${iconColor}10`, color: iconColor }}
            >
                {icon}
            </div>
            <h3 className="text-lg font-display font-semibold text-white mb-3">{title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
        </div>
    );
}

function StepCard({
    step,
    icon,
    title,
    desc,
}: {
    step: string;
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
    return (
        <div className="relative p-8 rounded-2xl bg-bg-elevated/50 border border-white/5 hover:border-white/10 transition-all duration-300">
            <span className="text-5xl font-display font-bold text-white/[0.03] absolute top-4 right-6 select-none">{step}</span>
            <div className="mb-4">{icon}</div>
            <h3 className="text-lg font-display font-semibold text-white mb-3">{title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
        </div>
    );
}

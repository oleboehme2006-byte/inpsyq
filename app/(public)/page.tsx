import Link from 'next/link';
import { ArrowRight, Activity, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-bg-base flex flex-col font-body selection:bg-accent-primary/30">

            {/* Navigation */}
            <nav className="w-full border-b border-border/50 bg-bg-base/80 backdrop-blur-md fixed top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-display font-semibold tracking-tight text-text-primary">
                            in<span className="text-accent-primary">Psyq</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                            Log in
                        </Link>
                        <Link
                            href="/executive"
                            className="px-4 py-2 rounded-full bg-text-primary text-bg-base text-sm font-medium hover:bg-white/90 transition-colors"
                        >
                            View Demo
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex flex-col">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-6 flex flex-col items-center text-center overflow-hidden">

                    {/* Background Effects */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent-primary/20 rounded-full blur-[120px] -z-10" />

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-elevated border border-border/50 text-xs font-mono text-accent-primary mb-8 animate-fade-in">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary"></span>
                        </span>
                        LIVE PREVIEW AVAILABLE
                    </div>

                    <h1 className="max-w-4xl text-5xl md:text-7xl font-display font-bold text-text-primary tracking-tight mb-6 animate-slide-up">
                        Organizational health, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
                            quantified in real-time.
                        </span>
                    </h1>

                    <p className="max-w-2xl text-lg text-text-secondary mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
                        The first AI-native platform for detecting burnout, engagement gaps, and systemic drivers before they impact delivery.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <Link
                            href="/executive"
                            className="px-8 py-4 rounded-full bg-accent-primary text-white font-medium hover:bg-accent-primary/90 transition-all hover:scale-105 flex items-center gap-2 shadow-glow"
                        >
                            Enter Executive Demo <ArrowRight className="w-4 h-4" />
                        </Link>
                        <button className="px-8 py-4 rounded-full bg-bg-elevated border border-border text-text-primary font-medium hover:bg-bg-hover transition-colors">
                            Read the Manifesto
                        </button>
                    </div>

                    {/* Hero Image / Dashboard Preview */}
                    <div className="mt-20 relative w-full max-w-6xl rounded-xl border border-border/50 shadow-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '400ms' }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-transparent z-10" />
                        {/* Simulate a dashboard look with CSS/Structure if no image available, 
                     but better to just have a placeholder or a very simplified CSS mock 
                 */}
                        <div className="bg-bg-elevated aspect-[16/9] flex items-center justify-center p-8">
                            <div className="w-full h-full bg-bg-base/50 rounded border border-border/30 flex items-center justify-center">
                                <span className="text-text-tertiary text-sm font-mono">INTERACTIVE DASHBOARD PREVIEW</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Feature Grid */}
                <section className="py-24 px-6 bg-bg-base">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Activity className="w-6 h-6 text-strain" />}
                            title="Early Detection"
                            desc="Identify strain patterns weeks before they manifest as attrition or missed deadlines."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="w-6 h-6 text-trust-gap" />}
                            title="Psychological Safety"
                            desc="Measure the unmeasurable. Visualize trust gaps and withdrawal risk with precision."
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-engagement" />}
                            title="Actionable Intervention"
                            desc="AI-generated recommendations that successfully recover 83% of at-risk teams."
                        />
                    </div>
                </section>
            </main>

            <footer className="py-8 px-6 border-t border-border/50 text-center text-text-tertiary text-sm">
                <p>© 2026 inPsyq Inc. All systems nominal.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="p-8 rounded-2xl bg-bg-elevated/50 border border-border/50 hover:bg-bg-elevated transition-colors group">
            <div className="mb-4 p-3 rounded-lg bg-bg-surface w-fit group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-display font-semibold text-text-primary mb-2">{title}</h3>
            <p className="text-text-secondary leading-relaxed">{desc}</p>
        </div>
    )
}

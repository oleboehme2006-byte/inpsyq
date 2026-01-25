import Link from "next/link";
import { ArrowRight, Activity, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 overflow-x-hidden">

            {/* Navigation */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo - Minimal Text Only as requested */}
                    <div className="text-xl font-bold tracking-tight font-display">
                        inPsyq
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/auth/login" className="text-sm text-slate-400 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link
                            href="/executive" // Linking to our new Executive Dashboard
                            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-slate-200 transition-colors"
                        >
                            View Demo
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background atmospheric glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-500/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 font-display">
                        <span className="block text-slate-400 mb-2">Social Sentiment.</span>
                        <span className="block text-slate-200 mb-2">Data-Driven Depth.</span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                            Psychological Insights.
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-12 leading-relaxed">
                        Instrument-grade psychological analytics for organizational health.
                        Identify strain, withdrawal risk, and trust gaps before they impact performance.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/executive"
                            className="px-8 py-3.5 rounded-full bg-white text-black font-semibold hover:bg-slate-200 transition-colors w-full sm:w-auto"
                        >
                            Explore Live Demo
                        </Link>
                        <Link
                            href="/documentation"
                            className="px-8 py-3.5 rounded-full bg-[#111113] border border-white/10 text-slate-300 hover:bg-white/5 transition-colors w-full sm:w-auto"
                        >
                            Read Methodology
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 border-t border-white/5 bg-[#0a0a0b]">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Activity}
                            title="Real-time Sensing"
                            description="Continuous passive measurement of organizational sentiment without survey fatigue."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Privacy First"
                            description="Aggregated, anonymized insights that protect individual psychological safety."
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Predictive Signals"
                            description="Early warning system for burnout, attrition risk, and cultural drift."
                        />
                    </div>
                </div>
            </section>

        </div>
    );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="p-8 rounded-2xl bg-[#111113] border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-[#18181b] flex items-center justify-center mb-6">
                <Icon className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 font-display">{title}</h3>
            <p className="text-slate-400 leading-relaxed">{description}</p>
        </div>
    )
}

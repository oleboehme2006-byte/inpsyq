import { resolveTeamIdentifier } from '@/lib/teams/resolver';
import { notFound } from 'next/navigation';
import { MetricCard } from "@/components/executive/MetricCard";
import { EngagementTrend } from "@/components/executive/EngagementTrend";
import { SystemicDrivers, Watchlist } from "@/components/executive/SystemicDrivers";
import { WeeklySummary, DataGovernance } from "@/components/executive/WeeklySummary";
import { RefreshCw, ArrowLeft } from "lucide-react";
import Link from 'next/link';

interface PageProps {
    params: {
        teamId: string;
    };
}

export default async function TeamByIdPage({ params }: PageProps) {
    const rawId = params.teamId;
    const resolvedId = await resolveTeamIdentifier(rawId);

    if (!resolvedId) {
        notFound();
    }

    // Capitalize for display
    const teamName = resolvedId.charAt(0).toUpperCase() + resolvedId.slice(1);

    return (
        <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-purple-500/30">

            {/* Header Bar */}
            <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/executive" className="p-2 rounded hover:bg-white/5 transition-colors text-slate-400">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs uppercase">
                                {teamName.substring(0, 2)}
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-white leading-tight">Team: {teamName}</h1>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>Detailed Analysis</span>
                                    <span>•</span>
                                    <span>Real-time signals</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 rounded-full bg-[#111113] border border-white/5 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                            LIVE DEMO
                        </span>
                        <button className="p-2 rounded hover:bg-white/5 transition-colors text-slate-400">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

                {/* Top Metrics Row - Customized for Team Context (Mock Values) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        label="Strain"
                        value="52%"
                        subValue="+2.1%"
                        status="At Risk"
                        trend="up"
                        color="strain"
                    />
                    <MetricCard
                        label="Withdrawal Risk"
                        value="38%"
                        subValue="+0.5%"
                        status="At Risk"
                        trend="up"
                        color="withdrawal"
                    />
                    <MetricCard
                        label="Trust Gap"
                        value="28%"
                        subValue="-1.2%"
                        status="Moderate"
                        trend="down"
                        color="trust"
                    />
                    <MetricCard
                        label="Engagement"
                        value="65%"
                        subValue="+1.5%"
                        status="Good"
                        trend="up"
                        color="engagement"
                    />
                </div>

                {/* Engagement Trend Chart */}
                <div className="w-full">
                    <EngagementTrend />
                </div>

                {/* Bottom Row: Drivers, Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                    <div className="space-y-12">
                        {/* Reusing Systemic Drivers but maybe title needs change? Kept same for now as requested "Same Guidelines" */}
                        <SystemicDrivers />
                        <WeeklySummary />
                    </div>
                    <div className="space-y-12">
                        {/* Watchlist might not make sense for a single team... maybe replace with Data Governance or specific team members list? 
                            User said: "Build every Team Demo with the same guidelines". 
                            I'll keep DataGovernance. Watchlist is less relevant for single team but I'll leave it or swap for purely DataGov.
                            I'll just use DataGovernance here to fill space cleanly.
                        */}
                        <DataGovernance />
                    </div>
                </div>

            </main>
        </div>
    );
}

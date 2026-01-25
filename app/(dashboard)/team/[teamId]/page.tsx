import { MetricCard } from "@/components/executive/MetricCard";
import { EngagementTrend } from "@/components/executive/EngagementTrend";
// We'll reuse SystemicDrivers/Watchlist but pretending they are team-scoped
import { SystemicDrivers, Watchlist } from "@/components/executive/SystemicDrivers";
import { RefreshCw, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
    params: {
        teamId: string;
    };
}

export default function TeamDashboardPage({ params }: PageProps) {
    // Uppercase first letter for display
    const teamName = params.teamId.charAt(0).toUpperCase() + params.teamId.slice(1);

    return (
        <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-purple-500/30">

            {/* Header Bar */}
            <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/executive" className="p-2 rounded hover:bg-white/5 transition-colors text-slate-400 hover:text-white" aria-label="Back to Executive Dashboard">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-500 to-green-500 flex items-center justify-center text-white font-bold text-xs">
                            {teamName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white leading-tight">{teamName} Team</h1>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Users className="w-3 h-3" />
                                <span>12 Members</span>
                                <span>•</span>
                                <span>Active Cycle</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 rounded hover:bg-white/5 transition-colors text-slate-400" aria-label="Refresh Data">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

                {/* Top Metrics Row - Team Scoped (Fake Data) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        label="Strain"
                        value="28%"
                        subValue="-2.1%"
                        status="Healthy"
                        trend="down"
                        color="strain"
                    />
                    <MetricCard
                        label="Withdrawal Risk"
                        value="15%"
                        subValue="-0.5%"
                        status="Minimal"
                        trend="down"
                        color="withdrawal"
                    />
                    <MetricCard
                        label="Trust Gap"
                        value="12%"
                        subValue="+1.2%"
                        status="Good"
                        trend="up"
                        color="trust"
                    />
                    <MetricCard
                        label="Engagement"
                        value="82%"
                        subValue="+4.5%"
                        status="Healthy"
                        trend="up"
                        color="engagement"
                    />
                </div>

                {/* Engagement Trend Chart */}
                <div className="w-full">
                    <EngagementTrend />
                </div>

                {/* Bottom Row: Drivers & Risks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-white">Team Drivers</h3>
                        <SystemicDrivers />
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-white">Risk Signals</h3>
                        {/* Reusing Watchlist to show individual risks within the team */}
                        <Watchlist />
                    </div>
                </div>

            </main>
        </div>
    );
}

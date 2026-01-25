import { engagementData } from "@/lib/data"; // Placeholder import logic if needed, but we used local mock
import { MetricCard } from "@/components/executive/MetricCard";
import { EngagementTrend } from "@/components/executive/EngagementTrend";
import { TeamPortfolio } from "@/components/executive/TeamPortfolio";
import { SystemicDrivers, Watchlist } from "@/components/executive/SystemicDrivers";
import { WeeklySummary, DataGovernance } from "@/components/executive/WeeklySummary";
import { RefreshCw, Command } from "lucide-react";

export default function ExecutiveDashboardPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-purple-500/30">

            {/* Header Bar - Matches "Acme Corporation" screenshot */}
            <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                            AC
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white leading-tight">Acme Corporation</h1>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>6 teams</span>
                                <span>•</span>
                                <span>9 weeks of data</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 rounded-full bg-[#111113] border border-white/5 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                            EXEC FIX PASS v2 — 2025-12-26 00:57:20
                        </span>
                        <button className="p-2 rounded hover:bg-white/5 transition-colors text-slate-400">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        label="Strain"
                        value="45%"
                        subValue="-6.6%"
                        status="Moderate" // Screenshot shows moderate
                        trend="down"
                        color="strain"
                    />
                    <MetricCard
                        label="Withdrawal Risk"
                        value="34%"
                        subValue="+1.3%"
                        status="Moderate"
                        trend="up"
                        color="withdrawal"
                    />
                    <MetricCard
                        label="Trust Gap"
                        value="29%"
                        subValue="+6.0%"
                        status="Minimal"
                        trend="up"
                        color="trust" // Uses Blue as requested
                    />
                    <MetricCard
                        label="Engagement"
                        value="60%"
                        subValue="-3.9%"
                        status="Stable"
                        trend="down"
                        color="engagement"
                    />
                </div>

                {/* Engagement Trend Chart */}
                <div className="w-full">
                    <EngagementTrend />
                </div>

                {/* Team Portfolio */}
                <div className="w-full pt-8 border-t border-white/5">
                    <TeamPortfolio />
                </div>

                {/* Bottom Row: Drivers, Watchlist, Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                    <div className="space-y-12">
                        <SystemicDrivers />
                        <WeeklySummary />
                    </div>
                    <div className="space-y-12">
                        <Watchlist />
                        <DataGovernance />
                    </div>
                </div>

            </main>
        </div>
    );
}

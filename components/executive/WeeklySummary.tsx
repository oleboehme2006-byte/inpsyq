"use client";

import { Sparkles, Clock, ShieldCheck, Database, Activity, Zap } from "lucide-react";

export function WeeklySummary() {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Weekly Summary</h3>

            <div className="w-full bg-[#0a0a0b] border border-white/5 rounded-xl p-6 relative overflow-hidden group">
                {/* Subtle glow effect behind AI badge */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50" />

                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-slate-200">Weekly Summary</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            AI-Generated
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>Today</span>
                    </div>
                </div>

                <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-light">
                    <p>
                        Organization-wide strain is moderate but concentrated. Two teams (<span className="text-white font-medium">Product</span> and <span className="text-white font-medium">Engineering</span>) account for 75% of observed risk signals. The primary systemic driver is sustained workload pressure, particularly acute in technical roles.
                    </p>
                    <p className="pl-3 border-l-2 border-green-500/50">
                        Positive note: Sales and HR demonstrate strong engagement trajectories, suggesting organizational culture fundamentals remain healthy. The risk is operational, not cultural.
                    </p>
                    <p>
                        The most significant concern is the Product team's accelerating strain trajectory. Without intervention, there is a <span className="text-orange-400">70% probability</span> of engagement decline spreading to dependent teams within 3 weeks. Early signals of contagion are already visible in Engineering's elevated strain.
                    </p>
                    <div className="bg-[#18181b] p-3 rounded border border-white/5 text-xs text-slate-400">
                        Recommended executive focus: • Immediate: Resource rebalancing for Product team • Short-term: Review Q4 commitments.
                    </div>
                </div>
            </div>
        </div>
    );
}

export function DataGovernance() {
    return (
        <div className="space-y-6 mt-12 mb-12">
            <h3 className="text-xl font-semibold text-white">Data Governance</h3>

            <div className="w-full bg-[#0a0a0b] border border-white/5 rounded-xl p-6">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-slate-400" />
                        <span className="text-base font-medium text-slate-200">Data Governance</span>
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-engagement/10 text-engagement border border-engagement/20 flex items-center gap-1.5">
                        <CheckCircleIcon className="w-3 h-3" /> High Confidence
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {/* Coverage */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1.5"><UsersIcon className="w-3 h-3" /> Coverage</span>
                            <span className="text-white font-mono">91%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#18181b] rounded-full overflow-hidden">
                            <div className="h-full bg-engagement w-[91%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        </div>
                    </div>

                    {/* Data Quality */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1.5"><CheckCircleIcon className="w-3 h-3" /> Data Quality</span>
                            <span className="text-white font-mono">88%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#18181b] rounded-full overflow-hidden">
                            <div className="h-full bg-engagement w-[88%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        </div>
                    </div>

                    {/* Temporal Stability */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1.5"><Activity className="w-3 h-3" /> Temporal Stability</span>
                            <span className="text-white font-mono">81%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#18181b] rounded-full overflow-hidden">
                            <div className="h-full bg-engagement w-[81%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        </div>
                    </div>

                    {/* Signal Confidence */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Signal Confidence</span>
                            <span className="text-white font-mono">75%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#18181b] rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 w-[75%] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <Database className="w-3 h-3" />
                        <span>50 total sessions</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>Last updated: Dec 24, 2025</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg role="img" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    )
}

function UsersIcon({ className }: { className?: string }) {
    return (
        <svg role="img" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
    )
}

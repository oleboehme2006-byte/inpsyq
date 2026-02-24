import React from 'react';
import Link from 'next/link';
import { Activity, LayoutDashboard, Lock } from 'lucide-react';

export default function TutorialHubPage() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center px-6 relative overflow-y-auto">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8B5CF6]/10 rounded-full blur-[150px] -z-10 pointer-events-none" />

            <div className="text-center mb-12 mt-12">
                <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">Select your Learning Track</h1>
                <p className="text-text-secondary max-w-lg mx-auto">
                    Experience how inPsyq translates raw psychological signals into actionable executive and operational intelligence.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full pb-20">
                {/* Executive Track */}
                <Link href="/tutorial/executive" className="group block h-full">
                    <div className="relative h-full rounded-2xl bg-[#050505] border border-white/10 p-8 transition-all duration-300 hover:border-[#0EA5E9]/50 hover:bg-[#0EA5E9]/5 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0EA5E9]/10 blur-[50px] rounded-full group-hover:bg-[#0EA5E9]/20 transition-colors" />
                        <Activity className="w-10 h-10 text-[#0EA5E9] mb-6" />
                        <h2 className="text-xl font-display font-bold text-white mb-2 group-hover:text-[#0EA5E9] transition-colors">Executive Board</h2>
                        <p className="text-sm text-text-tertiary font-mono mb-4 uppercase tracking-wider">Macro-level systemic risk</p>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            Learn to interpret the organizational weather map. Understand how the system aggregates thousands of data points to identify leading indicators of burnout and attrition before they affect delivery.
                        </p>
                    </div>
                </Link>

                {/* Teamlead Track */}
                <Link href="/tutorial/teamlead" className="group block h-full">
                    <div className="relative h-full rounded-2xl bg-[#050505] border border-white/10 p-8 transition-all duration-300 hover:border-[#E11D48]/50 hover:bg-[#E11D48]/5 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E11D48]/10 blur-[50px] rounded-full group-hover:bg-[#E11D48]/20 transition-colors" />
                        <LayoutDashboard className="w-10 h-10 text-[#E11D48] mb-6" />
                        <h2 className="text-xl font-display font-bold text-white mb-2 group-hover:text-[#E11D48] transition-colors">Team Operations</h2>
                        <p className="text-sm text-text-tertiary font-mono mb-4 uppercase tracking-wider">Micro-level causal drivers</p>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            Drill down into specific operational units. Understand how to isolate the root cause of friction—whether it's internal role clarity or external dependency bottlenecks—and apply targeted interventions.
                        </p>
                    </div>
                </Link>

                {/* Coming Soon Tracks */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 opacity-50 grayscale">
                    <div className="rounded-xl bg-[#020202] border border-white/5 p-6 flex flex-col gap-2 cursor-not-allowed">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-medium">Employee Pulse Session</h3>
                            <Lock className="w-4 h-4 text-white/20" />
                        </div>
                        <p className="text-xs text-text-tertiary">The 10-question psychometric instrument</p>
                    </div>
                    <div className="rounded-xl bg-[#020202] border border-white/5 p-6 flex flex-col gap-2 cursor-not-allowed">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-medium">Platform Administration</h3>
                            <Lock className="w-4 h-4 text-white/20" />
                        </div>
                        <p className="text-xs text-text-tertiary">Data privacy and systemic configuration</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

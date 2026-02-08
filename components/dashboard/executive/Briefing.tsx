import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Clock } from 'lucide-react';

export function Briefing() {
    return (
        <div className="w-full">
            <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xl font-display font-medium text-white">Briefing</h3>
                <div className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] font-mono text-text-tertiary uppercase tracking-widest">
                    Executive Summary
                </div>
            </div>

            <div className="w-full p-8 rounded-xl border border-white/10 bg-[#050505]">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-white/5 text-white">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Weekly Synthesis</p>
                            <p className="text-xs text-text-tertiary">Based on 142 data points</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-text-tertiary text-xs font-mono">
                        <Clock className="w-3 h-3" />
                        <span>Generated 2 hours ago</span>
                    </div>
                </div>

                <div className="prose prose-invert max-w-none">
                    <div className="space-y-6 text-base text-text-secondary leading-relaxed font-body">
                        <p>
                            <span className="text-white font-medium">Critical Observation:</span> Organization-wide strain has increased by <span className="text-strain">12%</span> week-over-week. This trend is primarily driven by the &apos;Product&apos; team, where resource contention is creating localized burnout risks.
                        </p>

                        <div className="grid grid-cols-2 gap-8 my-6">
                            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                                <p className="text-xs text-text-tertiary uppercase tracking-widest mb-2 font-mono">Primary Driver</p>
                                <p className="text-white font-medium">Workload Saturation</p>
                                <p className="text-sm text-text-secondary mt-1">Correlation with deadline pressure is 0.85.</p>
                            </div>
                            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                                <p className="text-xs text-text-tertiary uppercase tracking-widest mb-2 font-mono">Projected Impact</p>
                                <p className="text-strain font-medium">Risk of Attrition</p>
                                <p className="text-sm text-text-secondary mt-1">If unaddressed, withdrawal risk may peak in 2 weeks.</p>
                            </div>
                        </div>

                        <p>
                            <span className="text-white font-medium">Recommendation:</span> Immediate executive intervention is suggested for the Product team. Consider a temporary scope freeze or contractor support to alleviate short-term pressure.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Clock } from 'lucide-react';
import { WeeklyInterpretationRecord } from '@/lib/interpretation/types';

interface BriefingProps {
    interpretation?: WeeklyInterpretationRecord | null;
}

export function Briefing({ interpretation }: BriefingProps) {
    return (
        <div className="w-full p-6 rounded-xl border border-white/10 bg-[#050505] flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-medium text-white">Briefing</h3>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#845EEE]/10 border border-[#845EEE]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#845EEE] animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-[#845EEE] uppercase tracking-widest">LLM-Supported</span>
                </div>
            </div>

            {/* Content - Two Column "Paper" Layout */}
            <div className="prose prose-invert max-w-none block space-y-4 columns-1 md:columns-2 gap-12 font-body text-sm text-text-secondary leading-relaxed text-justify">
                {interpretation ? (
                    <>
                        <p className="break-inside-avoid-column mb-4">
                            {interpretation.sectionsJson.executiveSummary}
                        </p>
                        <p className="break-inside-avoid-column mb-4">
                            {interpretation.sectionsJson.whatChanged.join(' ')}
                            <br /><br />
                            {interpretation.sectionsJson.riskOutlook.join(' ')}
                        </p>
                        <p className="break-inside-avoid-column mb-4">
                            <span className="text-white font-medium">Primary Drivers:</span>
                            <ul className="list-disc pl-4 mt-2 mb-2">
                                {interpretation.sectionsJson.primaryDrivers.internal.map((d: any, i: number) => (
                                    <li key={i}>{d.label} ({d.severityLevel}) - {d.evidenceTag}</li>
                                ))}
                            </ul>
                        </p>
                        <p className="break-inside-avoid-column">
                            <span className="text-white font-medium">Recommendation:</span> {interpretation.sectionsJson.recommendedFocus.join(' ')}
                            <br /><br />
                            <span className="text-xs text-white/50">{interpretation.sectionsJson.confidenceAndLimits}</span>
                        </p>
                    </>
                ) : (
                    <p className="break-inside-avoid-column">
                        No interpretation available for this week.
                    </p>
                )}
            </div>
        </div>
    );
}

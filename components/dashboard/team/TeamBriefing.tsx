import React from 'react';
import { cn } from '@/lib/utils';

interface TeamBriefingProps {
    teamName: string;
    paragraphs: string[];
}

export function TeamBriefing({ teamName, paragraphs }: TeamBriefingProps) {
    return (
        <div className="w-full p-6 rounded-xl border border-white/10 bg-[#050505] flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-medium text-white">{teamName} Briefing</h3>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#845EEE]/10 border border-[#845EEE]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#845EEE] animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-[#845EEE] uppercase tracking-widest">LLM-Supported</span>
                </div>
            </div>

            {/* Content - Two-column layout matching executive briefing */}
            <div className="grid grid-cols-2 gap-8 prose prose-invert max-w-none font-body text-sm text-text-secondary leading-relaxed text-justify">
                {paragraphs.map((p, i) => (
                    <div key={i} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
            </div>
        </div>
    );
}

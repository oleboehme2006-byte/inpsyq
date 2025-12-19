'use client';

import React, { useState } from 'react';
import { DriverAttribution, CausalLabel } from '@/lib/dashboard/types';
import { safeToFixed } from '@/lib/utils/safeNumber';

interface DriversBlockProps {
    topRisks: DriverAttribution[];
    topStrengths: DriverAttribution[];
}

const CAUSAL_BADGES: Record<CausalLabel, { label: string; color: string }> = {
    strong_causal: { label: 'Strong', color: 'bg-purple-900/50 text-purple-300' },
    likely_causal: { label: 'Likely', color: 'bg-blue-900/50 text-blue-300' },
    correlational: { label: 'Correlated', color: 'bg-slate-800 text-slate-400' },
    unknown: { label: 'Unknown', color: 'bg-slate-900 text-slate-500' },
};

function ImpactBar({ impact, direction }: { impact: number; direction: 'positive' | 'negative' }) {
    const width = Math.min(impact * 100, 100);
    const color = direction === 'negative' ? 'bg-red-500' : 'bg-green-500';

    return (
        <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
                className={`h-full ${color} rounded-full transition-all`}
                style={{ width: `${width}%` }}
            />
        </div>
    );
}

function DriverRow({ driver, expanded, onToggle }: { driver: DriverAttribution; expanded: boolean; onToggle: () => void }) {
    const causal = CAUSAL_BADGES[driver.causal_label];

    return (
        <div className="border-b border-slate-800/50 last:border-0">
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 py-3 px-2 hover:bg-slate-800/30 transition-colors text-left"
            >
                <div className="flex-grow">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">{driver.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${causal.color}`}>
                            {causal.label}
                        </span>
                    </div>
                    <div className="text-xs text-slate-500">{driver.construct}</div>
                </div>
                <ImpactBar impact={driver.impact} direction={driver.direction} />
                <span className="text-xs text-slate-500 w-12 text-right">
                    {safeToFixed(driver.impact * 100, 0)}%
                </span>
                <span className="text-slate-600 text-sm">{expanded ? '−' : '+'}</span>
            </button>

            {expanded && (
                <div className="px-4 pb-3 text-sm text-slate-400 bg-slate-800/20">
                    <p className="mb-2">{driver.explanation}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Scope: {driver.scope}</span>
                        <span>Uncertainty: {safeToFixed(driver.uncertainty * 100, 0)}%</span>
                        {driver.is_actionable && (
                            <span className="text-green-400">✓ Actionable</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DriversBlock({ topRisks, topStrengths }: DriversBlockProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showStrengths, setShowStrengths] = useState(false);

    const drivers = showStrengths ? topStrengths : topRisks;

    if (topRisks.length === 0 && topStrengths.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 italic">
                Insufficient data to identify drivers
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toggle */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setShowStrengths(false)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${!showStrengths
                            ? 'bg-red-900/40 text-red-300'
                            : 'bg-slate-800/50 text-slate-400 hover:text-slate-300'
                        }`}
                >
                    Risks ({topRisks.length})
                </button>
                <button
                    onClick={() => setShowStrengths(true)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${showStrengths
                            ? 'bg-green-900/40 text-green-300'
                            : 'bg-slate-800/50 text-slate-400 hover:text-slate-300'
                        }`}
                >
                    Strengths ({topStrengths.length})
                </button>
            </div>

            {/* Driver List */}
            <div className="flex-grow overflow-y-auto">
                {drivers.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 italic text-sm">
                        No {showStrengths ? 'strengths' : 'risks'} identified
                    </div>
                ) : (
                    drivers.map((d) => (
                        <DriverRow
                            key={d.construct}
                            driver={d}
                            expanded={expandedId === d.construct}
                            onToggle={() => setExpandedId(expandedId === d.construct ? null : d.construct)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

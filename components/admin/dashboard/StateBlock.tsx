'use client';

import React from 'react';
import { StateBlock as StateBlockType, GovernanceStatus, ScoreBand } from '@/lib/dashboard/types';
import { safeToFixed } from '@/lib/utils/safeNumber';

interface StateBlockProps {
    state: StateBlockType;
}

const SEVERITY_COLORS: Record<ScoreBand, string> = {
    excellent: 'from-emerald-500 to-green-600',
    good: 'from-green-500 to-teal-600',
    moderate: 'from-amber-500 to-yellow-600',
    concerning: 'from-orange-500 to-red-600',
    critical: 'from-red-600 to-rose-700',
};

const SEVERITY_TEXT: Record<ScoreBand, string> = {
    excellent: 'text-emerald-400',
    good: 'text-green-400',
    moderate: 'text-amber-400',
    concerning: 'text-orange-400',
    critical: 'text-red-400',
};

const GOVERNANCE_BADGES: Record<GovernanceStatus, { bg: string; text: string; label: string }> = {
    clear: { bg: 'bg-green-900/30', text: 'text-green-400', label: 'Clear' },
    review_needed: { bg: 'bg-amber-900/30', text: 'text-amber-400', label: 'Review Needed' },
    blocked: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Blocked' },
};

export default function StateBlock({ state }: StateBlockProps) {
    const colorGradient = SEVERITY_COLORS[state.score_band] || SEVERITY_COLORS.moderate;
    const textColor = SEVERITY_TEXT[state.score_band] || SEVERITY_TEXT.moderate;
    const governance = GOVERNANCE_BADGES[state.governance_status];

    return (
        <div className="flex flex-col h-full">
            {/* State Badge */}
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${colorGradient} flex items-center justify-center shadow-lg`}>
                    <span className="text-2xl font-bold text-white">
                        {state.label === 'CRITICAL' ? '!' : state.label === 'AT_RISK' ? '⚠' : state.label === 'HEALTHY' ? '✓' : '?'}
                    </span>
                </div>
                <div>
                    <div className={`text-2xl font-bold ${textColor}`}>
                        {state.label.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">
                        Severity: {safeToFixed(state.severity * 100, 0)}%
                    </div>
                </div>
            </div>

            {/* Explanation */}
            <p className="text-sm text-slate-400 mb-4 flex-grow">
                {state.explanation}
            </p>

            {/* Governance & Confidence */}
            <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-800/50">
                <span className={`px-2 py-1 rounded text-xs font-medium ${governance.bg} ${governance.text}`}>
                    {governance.label}
                </span>
                <span className="text-xs text-slate-500">
                    Confidence: {safeToFixed(state.confidence * 100, 0)}%
                </span>
                {state.last_measured_at && (
                    <span className="text-xs text-slate-600 ml-auto">
                        Last: {new Date(state.last_measured_at).toLocaleDateString()}
                    </span>
                )}
            </div>
        </div>
    );
}

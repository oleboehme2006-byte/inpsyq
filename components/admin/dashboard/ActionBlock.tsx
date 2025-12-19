'use client';

import React from 'react';
import { RecommendedAction } from '@/lib/dashboard/types';
import { ActionUrgency } from '@/services/decision/types';

interface ActionBlockProps {
    recommended: RecommendedAction;
    alternatives: RecommendedAction[];
}

const URGENCY_STYLES: Record<ActionUrgency, { bg: string; text: string; label: string }> = {
    IMMEDIATE: { bg: 'bg-red-900/40', text: 'text-red-300', label: 'Immediate' },
    HIGH: { bg: 'bg-orange-900/40', text: 'text-orange-300', label: 'High Priority' },
    NORMAL: { bg: 'bg-blue-900/40', text: 'text-blue-300', label: 'Normal' },
};

export default function ActionBlock({ recommended, alternatives }: ActionBlockProps) {
    const urgency = URGENCY_STYLES[recommended.urgency] || URGENCY_STYLES.NORMAL;

    return (
        <div className="flex flex-col h-full">
            {/* Primary Action */}
            <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-xl p-5 border border-purple-700/30 mb-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🎯</span>
                    </div>
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-semibold text-slate-100">
                                {recommended.title}
                            </h4>
                            <span className={`text-xs px-2 py-0.5 rounded ${urgency.bg} ${urgency.text}`}>
                                {urgency.label}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">
                            {recommended.description}
                        </p>
                    </div>
                </div>

                {/* Rationale */}
                <div className="mt-4 pt-4 border-t border-purple-700/30">
                    <h5 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Why This Action</h5>
                    <p className="text-sm text-slate-300">{recommended.rationale}</p>
                </div>

                {/* Expected Effect */}
                <div className="mt-4 pt-4 border-t border-purple-700/30">
                    <h5 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Expected Effect</h5>
                    <p className="text-sm text-slate-300">{recommended.expected_effect}</p>
                </div>

                {/* Checklist */}
                {recommended.checklist && recommended.checklist.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-purple-700/30">
                        <h5 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Implementation Steps</h5>
                        <ul className="space-y-1">
                            {recommended.checklist.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                                    <span className="text-slate-600">□</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Monitor */}
                {recommended.monitor_constructs.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-purple-700/30">
                        <h5 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Monitor These</h5>
                        <div className="flex flex-wrap gap-2">
                            {recommended.monitor_constructs.map(c => (
                                <span key={c} className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">
                                    {c}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Alternatives */}
            {alternatives.length > 0 && (
                <div className="mt-auto">
                    <h5 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Alternative Actions</h5>
                    <div className="space-y-2">
                        {alternatives.slice(0, 2).map(alt => (
                            <div
                                key={alt.action_id}
                                className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-300">{alt.title}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${URGENCY_STYLES[alt.urgency].bg} ${URGENCY_STYLES[alt.urgency].text}`}>
                                        {URGENCY_STYLES[alt.urgency].label}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{alt.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

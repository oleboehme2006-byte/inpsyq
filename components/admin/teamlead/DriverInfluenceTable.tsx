import React from 'react';
import { AnalysedDriver, InfluenceScope } from '@/services/decision/types';

interface DriverInfluenceTableProps {
    drivers: {
        top_risks: AnalysedDriver[];
    };
}

const SCOPE_ORDER: InfluenceScope[] = ['LEADERSHIP', 'TEAM', 'INDIVIDUAL', 'ORGANIZATION', 'SYSTEMIC'];

export default function DriverInfluenceTable({ drivers }: DriverInfluenceTableProps) {
    // Group drivers by Scope
    const grouped = drivers.top_risks.reduce((acc, d) => {
        if (!acc[d.influence_scope]) acc[d.influence_scope] = [];
        acc[d.influence_scope].push(d);
        return acc;
    }, {} as Record<InfluenceScope, AnalysedDriver[]>);

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl h-full overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Influence Map</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="space-y-6">
                    {SCOPE_ORDER.map(scope => {
                        const items = grouped[scope];
                        if (!items || items.length === 0) return null;

                        return (
                            <div key={scope}>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">
                                    {scope} Level
                                </div>
                                <div className="space-y-3">
                                    {items.map(d => (
                                        <div key={d.parameter} className="bg-slate-900 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="font-medium text-slate-200">{d.label}</div>
                                                {d.is_actionable ? (
                                                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase">Actionable</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase">Monitor</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-400 mb-2">{d.explanation}</div>
                                            {/* Impact Bar */}
                                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${d.direction === 'NEGATIVE' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(d.impact * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {drivers.top_risks.length === 0 && (
                        <div className="text-slate-500 text-sm italic text-center py-8">
                            No significant risk drivers identified.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

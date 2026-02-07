import React from 'react';
import { cn } from '@/lib/utils';

interface DetailCardProps {
    type: 'driver' | 'watchlist';
    data: any;
    onClose: () => void;
}

export function DetailCard({ type, data, onClose }: DetailCardProps) {
    if (!data || !data.details) return null;

    return (
        <div className="w-full h-full bg-[#050505] rounded-xl border border-white/10 p-6 flex flex-col animate-in fade-in duration-500 slide-in-from-bottom-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-display font-medium text-white">Details</h3>
                <span className="text-xs font-mono text-text-tertiary uppercase tracking-widest">
                    {type === 'driver' ? 'Systemic Analysis' : 'Risk Analysis'}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">

                {/* Header for the Item */}
                <div>
                    <h4 className={cn("text-lg font-medium mb-1",
                        type === 'watchlist' ? "text-strain" : "text-white"
                    )}>
                        {type === 'driver' ? data.label : data.team}
                    </h4>
                    {type === 'driver' && (
                        <div className="flex items-center gap-2">
                            <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden max-w-[100px]">
                                <div style={{ width: `${data.score}%` }} className="h-full bg-gradient-to-r from-strain to-withdrawal" />
                            </div>
                            <span className="text-xs text-text-secondary">{data.score}% Impact</span>
                        </div>
                    )}
                    {type === 'watchlist' && (
                        <span className="text-xs font-mono text-text-secondary uppercase tracking-wider">
                            Most Critical Issue
                        </span>
                    )}
                </div>

                <div className="h-px bg-white/5 w-full my-2" />

                {/* Sections */}
                <div className="space-y-4 text-sm leading-relaxed text-text-secondary">

                    {/* DRIVER CONTENT */}
                    {type === 'driver' && (
                        <>
                            <div>
                                <span className="block text-[10px] font-mono text-text-tertiary uppercase tracking-widest mb-1">Mechanism</span>
                                <p>{data.details.mechanism}</p>
                            </div>
                            <div>
                                <span className="block text-[10px] font-mono text-text-tertiary uppercase tracking-widest mb-1">Influence</span>
                                <p>{data.details.influence}</p>
                            </div>
                            <div>
                                <span className="block text-[10px] font-mono text-text-tertiary uppercase tracking-widest mb-1">Recommendation</span>
                                <p className="text-white bg-white/5 p-3 rounded-lg border border-white/5">
                                    {data.details.recommendation}
                                </p>
                            </div>
                        </>
                    )}

                    {/* WATCHLIST CONTENT */}
                    {type === 'watchlist' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-[10px] font-mono text-text-tertiary uppercase tracking-widest mb-1">Criticality</span>
                                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded border uppercase",
                                        data.details.criticality === 'HIGH' ? "text-strain bg-strain/10 border-strain/20" :
                                            data.details.criticality === 'AT RISK' ? "text-withdrawal bg-withdrawal/10 border-withdrawal/20" :
                                                "text-engagement bg-engagement/10 border-engagement/20"
                                    )}>
                                        {data.details.criticality}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span className="block text-[10px] font-mono text-text-tertiary uppercase tracking-widest mb-1">Context & Causality</span>
                                <p className="mb-2">{data.details.context}</p>
                                <p className="opacity-80 italic">{data.details.causality}</p>
                            </div>

                            <div>
                                <span className="block text-[10px] font-mono text-text-tertiary uppercase tracking-widest mb-1">Effects</span>
                                <p>{data.details.effects}</p>
                            </div>

                            <div>
                                <span className="block text-[10px] font-mono text-text-tertiary uppercase tracking-widest mb-1">Recommendation</span>
                                <p className="text-white bg-white/5 p-3 rounded-lg border border-white/5">
                                    {data.details.recommendation}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

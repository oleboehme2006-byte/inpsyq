import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface TeamDetailCardProps {
    type: 'driver' | 'action';
    data: any;
    onClose: () => void;
}

export function TeamDetailCard({ type, data, onClose }: TeamDetailCardProps) {
    if (!data || !data.details) return null;

    const getIcon = () => {
        if (type === 'action') {
            if (data.severity === 'critical') return <AlertTriangle className="w-5 h-5 text-strain" />;
            if (data.severity === 'warning') return <AlertCircle className="w-5 h-5 text-withdrawal" />;
            return <Info className="w-5 h-5 text-engagement" />;
        }

        // Internal Drivers - Map score to icons
        if (data.score > 70) return <AlertTriangle className="w-5 h-5 text-strain" />;
        if (data.score > 40) return <AlertCircle className="w-5 h-5 text-withdrawal" />;
        return <Info className="w-5 h-5 text-engagement" />;
    };

    return (
        <div className="w-full h-full bg-[#050505] rounded-xl border border-white/10 p-6 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 shrink-0 border-b border-white/5 pb-4">
                <h3 className="text-2xl font-display font-medium text-white">Details</h3>
                <div className="h-6 w-px bg-white/10 mx-2" />
                <div className="flex items-center gap-3">
                    {getIcon()}
                    <h4 className="text-xl font-medium text-white">
                        {type === 'driver' ? data.label : data.title}
                    </h4>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-8 overflow-y-auto pr-2 custom-scrollbar">

                    {/* Left Column */}
                    <div className="space-y-6">
                        {type === 'driver' && (
                            <>
                                <div>
                                    <span className="block text-[10px] font-mono text-text-tertiary uppercase tracking-widest mb-2">Mechanism</span>
                                    <p className="text-sm text-text-secondary leading-relaxed">{data.details.mechanism}</p>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-mono text-text-tertiary uppercase tracking-widest mb-2">Causality Chain</span>
                                    <p className="text-sm text-text-tertiary italic leading-relaxed">{data.details.causality}</p>
                                </div>
                            </>
                        )}

                        {type === 'action' && (
                            <>
                                <div>
                                    <span className="block text-[10px] font-mono text-text-tertiary uppercase tracking-widest mb-2">Context & Rationale</span>
                                    <p className="text-sm text-text-secondary leading-relaxed mb-3">{data.details.context}</p>
                                    <p className="text-sm text-text-tertiary italic">{data.details.rationale}</p>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-mono text-text-tertiary uppercase tracking-widest mb-2">Expected Effects</span>
                                    <p className="text-sm text-text-secondary leading-relaxed">{data.details.effects}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {type === 'driver' && (
                            <div>
                                <span className="block text-[10px] font-mono text-text-tertiary uppercase tracking-widest mb-2">Effects</span>
                                <p className="text-sm text-text-secondary leading-relaxed">{data.details.effects}</p>
                            </div>
                        )}
                        <div>
                            <span className="block text-[10px] font-mono text-text-tertiary uppercase tracking-widest mb-2">Recommendation</span>
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                <p className="text-sm text-white leading-relaxed">
                                    {data.details.recommendation}
                                </p>
                            </div>
                        </div>

                        {/* Impact Score for drivers */}
                        {type === 'driver' && (
                            <div className="pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-text-tertiary uppercase">Impact Score</span>
                                    <span className="text-xl font-mono text-white">{data.score}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div style={{ width: `${data.score}%` }} className="h-full bg-gradient-to-r from-withdrawal to-strain" />
                                </div>
                            </div>
                        )}

                        {/* Criticality badge for actions */}
                        {type === 'action' && (
                            <div className="pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-text-tertiary uppercase">Criticality</span>
                                    <span className={cn("text-sm font-mono font-bold uppercase",
                                        data.details.criticality === 'HIGH' ? "text-strain" :
                                            data.details.criticality === 'AT RISK' ? "text-withdrawal" :
                                                "text-engagement"
                                    )}>
                                        {data.details.criticality}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

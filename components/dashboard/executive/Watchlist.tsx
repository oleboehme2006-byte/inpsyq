import React from 'react';
import { cn } from '@/lib/utils';
import { executiveMockData } from '@/lib/mock/executiveData';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface WatchlistProps {
    selectedId?: string;
    onSelect?: (id: string) => void;
    isCompact?: boolean;
}

export function Watchlist({ selectedId, onSelect, isCompact }: WatchlistProps) {
    const list = executiveMockData.watchlist;

    return (
        <div className="w-full h-full bg-[#050505] rounded-xl border border-white/10 p-5 flex flex-col transition-all duration-500 overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0 h-8">
                <h3 className="font-display text-xl font-medium text-white transition-all duration-500 whitespace-nowrap">
                    Watchlist
                </h3>
                <span className={cn("text-xs font-mono text-text-tertiary uppercase tracking-widest transition-opacity duration-300 delay-100",
                    isCompact ? "opacity-0" : "opacity-100"
                )}>
                    Criticality
                </span>
            </div>

            <div className="flex-1 flex flex-col gap-3">
                {list.map((item) => {
                    const isSelected = selectedId === item.id;
                    const borderColorClass = item.severity === 'critical' ? "border-l-strain" :
                        item.severity === 'warning' ? "border-l-withdrawal" : "border-l-engagement";
                    const iconColorClass = item.severity === 'critical' ? "text-strain" :
                        item.severity === 'warning' ? "text-withdrawal" : "text-engagement";

                    const criticalityLabel = item.severity === 'critical' ? 'HIGH' :
                        item.severity === 'warning' ? 'AT RISK' : 'LOW';

                    const criticalityBg = item.severity === 'critical' ? 'bg-strain/10 text-strain' :
                        item.severity === 'warning' ? 'bg-withdrawal/10 text-withdrawal' : 'bg-engagement/10 text-engagement';

                    return (
                        <button
                            key={item.id}
                            onClick={() => onSelect?.(item.id)}
                            className={cn(
                                "group w-full text-left flex flex-col justify-center gap-1 rounded-r-lg border-y border-r border-l-[3px] transition-all duration-500 relative overflow-hidden h-20 p-3",
                                borderColorClass,
                                isSelected
                                    ? "bg-white/[0.03] border-y-white/20 border-r-white/20"
                                    : "bg-transparent border-y-transparent border-r-transparent hover:bg-white/[0.02]"
                            )}
                        >
                            <div className="flex items-center gap-3 w-full">
                                {/* Icon moved inside Header row for alignment */}
                                <div className="shrink-0">
                                    {item.severity === 'critical' && <AlertTriangle className={cn("w-4 h-4", iconColorClass)} />}
                                    {item.severity === 'warning' && <AlertCircle className={cn("w-4 h-4", iconColorClass)} />}
                                    {item.severity === 'info' && <Info className={cn("w-4 h-4", iconColorClass)} />}
                                </div>

                                <span className={cn("font-medium transition-colors whitespace-nowrap text-lg flex-1",
                                    isSelected ? "text-white" : "text-text-primary"
                                )}>
                                    {item.team}
                                </span>

                                {/* Criticality Label */}
                                <span className={cn("text-xs font-mono px-1.5 py-0.5 rounded uppercase tracking-wider transition-opacity duration-300",
                                    criticalityBg,
                                    isCompact ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                                )}>
                                    {criticalityLabel}
                                </span>
                            </div>

                            {/* Message - Fades out in compact */}
                            <p className={cn("text-xs text-text-secondary line-clamp-1 leading-relaxed opacity-80 group-hover:opacity-100 transition-all duration-500 pl-7", // pl-7 to align with text start (icon width + gap)
                                isCompact ? "h-0 opacity-0 overflow-hidden" : "h-auto opacity-80"
                            )}>
                                {item.message}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* View All - Fades out in compact */}
            <div className={cn("mt-2 transition-all duration-500 overflow-hidden shrink-0",
                isCompact ? "max-h-0 opacity-0" : "max-h-8 opacity-100"
            )}>
                <button className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary hover:text-white transition-colors text-left pl-1">
                    + View All
                </button>
            </div>
        </div>
    );
}

import React from 'react';
import { cn } from '@/lib/utils';
import { executiveMockData } from '@/lib/mock/executiveData';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export function Watchlist({
    selectedId,
    onSelect,
    compact = false
}: {
    selectedId?: string,
    onSelect?: (id: string) => void,
    compact?: boolean
}) {
    const list = executiveMockData.watchlist;

    return (
        <div className={cn(
            "w-full h-full bg-[#050505] rounded-xl border border-white/10 flex flex-col transition-all duration-500 overflow-hidden",
            compact ? "p-3" : "p-5"
        )}>
            {!compact && (
                <div className="flex items-center justify-between mb-4 animate-in fade-in duration-300">
                    <h3 className="text-xl font-display font-medium text-white">Watchlist</h3>
                    <span className="text-xs font-mono text-text-tertiary uppercase tracking-widest">
                        Criticality
                    </span>
                </div>
            )}

            <div className="flex-1 space-y-2 flex flex-col justify-center">
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
                                "group w-full text-left transition-all duration-300",
                                compact
                                    ? "flex flex-col items-center justify-center p-2 py-3 rounded-lg border gap-2 h-auto"
                                    : "flex items-start gap-3 p-3 rounded-r-lg border-y border-r border-l-[3px]",
                                compact && isSelected ? "bg-white/[0.03] border-white/20" : "",
                                compact && !isSelected ? "bg-transparent border-transparent hover:bg-white/[0.02]" : "",
                                !compact && borderColorClass,
                                !compact && isSelected
                                    ? "bg-white/[0.03] border-y-white/20 border-r-white/20"
                                    : !compact ? "bg-transparent border-y-transparent border-r-transparent hover:bg-white/[0.02]" : ""
                            )}
                        >
                            <div className={cn("shrink-0", compact ? "" : "mt-0.5")}>
                                {item.severity === 'critical' && <AlertTriangle className={cn(compact ? "w-5 h-5" : "w-4 h-4", iconColorClass)} />}
                                {item.severity === 'warning' && <AlertCircle className={cn(compact ? "w-5 h-5" : "w-4 h-4", iconColorClass)} />}
                                {item.severity === 'info' && <Info className={cn(compact ? "w-5 h-5" : "w-4 h-4", iconColorClass)} />}
                            </div>

                            {compact ? (
                                <div className="text-center w-full">
                                    <span className={cn("text-[10px] font-medium truncate block leading-tight", isSelected ? "text-white" : "text-text-primary")}>
                                        {item.team}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={cn("text-sm font-medium transition-colors", isSelected ? "text-white" : "text-text-primary")}>
                                            {item.team}
                                        </span>
                                        <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider", criticalityBg)}>
                                            {criticalityLabel}
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100">
                                        {item.message}
                                    </p>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {!compact && (
                <button className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary hover:text-white transition-colors mt-2 text-left pl-1 animate-in fade-in">
                    + View Full Risk Log
                </button>
            )}
        </div>
    );
}

import React from 'react';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

export interface SystemicDriverUI {
    id: string;
    label: string;
    scope: string; // 'Organization' | 'Department'
    score: number; // 0-100
}

interface SystemicDriversProps {
    drivers: SystemicDriverUI[];
    selectedId?: string;
    onSelect?: (id: string) => void;
    isCompact?: boolean;
}

export function SystemicDrivers({ drivers, selectedId, onSelect, isCompact }: SystemicDriversProps) {
    const displayDrivers = drivers.slice(0, 3);

    return (
        <div className="w-full h-full bg-[#050505] rounded-xl border border-white/10 p-5 flex flex-col transition-all duration-500 overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0 h-8">
                <h3 className="font-display text-xl font-medium text-white transition-all duration-500 whitespace-nowrap">
                    Systemic Drivers
                </h3>
                <span className={cn("text-xs font-mono text-text-tertiary uppercase tracking-widest transition-opacity duration-300 delay-100",
                    isCompact ? "opacity-0" : "opacity-100"
                )}>
                    Influence
                </span>
            </div>

            <div className="flex-1 flex flex-col gap-3">
                {drivers.map((driver) => {
                    const isSelected = selectedId === driver.id;
                    return (
                        <button
                            key={driver.id}
                            onClick={() => onSelect?.(driver.id)}
                            className={cn(
                                "group w-full text-left transition-all duration-500 rounded-lg border relative flex flex-col justify-center h-20 p-3",
                                isSelected
                                    ? "bg-white/[0.03] border-white/20"
                                    : "bg-transparent border-transparent hover:bg-white/[0.02]"
                            )}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className={cn("font-medium transition-all duration-300 whitespace-nowrap text-lg",
                                    isSelected ? "text-white" : "text-text-secondary group-hover:text-white"
                                )}>
                                    {driver.label}
                                </span>

                                {/* Scope Label - Fades out in compact */}
                                <span className={cn(
                                    "px-0 py-0 text-xs font-mono uppercase tracking-widest transition-opacity duration-300",
                                    driver.scope.toLowerCase() === 'organization' ? "text-strain" :
                                        driver.scope.toLowerCase() === 'department' ? "text-withdrawal" :
                                            "text-engagement",
                                    isCompact ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                                )}>
                                    {driver.scope}
                                </span>
                            </div>

                            {/* Progress Bar - Fades out in compact */}
                            <div className={cn("relative w-full rounded-full overflow-hidden transition-all duration-500 ease-in-out mt-3",
                                isCompact ? "h-0 opacity-0 mt-0" : "h-1 opacity-100"
                            )}>
                                <div
                                    className="absolute left-0 top-0 h-full rounded-full"
                                    style={{
                                        width: `${driver.score}%`,
                                        background: 'linear-gradient(90deg, var(--color-withdrawal) 0%, var(--color-strain) 100%)'
                                    }}
                                />
                            </div>
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

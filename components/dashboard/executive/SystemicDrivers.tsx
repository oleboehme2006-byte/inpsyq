import React from 'react';
import { cn } from '@/lib/utils';
import { executiveMockData } from '@/lib/mock/executiveData';
import { Globe, Building2, User } from 'lucide-react';

export function SystemicDrivers({
    selectedId,
    onSelect,
    compact = false
}: {
    selectedId?: string,
    onSelect?: (id: string) => void,
    compact?: boolean
}) {
    const drivers = executiveMockData.drivers.slice(0, 3);

    return (
        <div className={cn(
            "w-full h-full bg-[#050505] rounded-xl border border-white/10 flex flex-col transition-all duration-500 overflow-hidden",
            compact ? "p-3" : "p-5"
        )}>
            {!compact && (
                <div className="flex items-center justify-between mb-4 animate-in fade-in duration-300">
                    <h3 className="text-xl font-display font-medium text-white">Systemic Drivers</h3>
                    <span className="text-xs font-mono text-text-tertiary uppercase tracking-widest">
                        Influence
                    </span>
                </div>
            )}

            <div className="flex-1 space-y-2 flex flex-col justify-center">
                {drivers.map((driver) => {
                    const isSelected = selectedId === driver.id;

                    let Icon = User;
                    if (driver.scope.toLowerCase() === 'organization') Icon = Globe;
                    if (driver.scope.toLowerCase() === 'department') Icon = Building2;

                    return (
                        <button
                            key={driver.id}
                            onClick={() => onSelect?.(driver.id)}
                            className={cn(
                                "group w-full text-left transition-all duration-300 rounded-lg border relative overflow-hidden",
                                compact ? "p-2 py-3 flex flex-col items-center justify-center gap-2 h-auto" : "p-3",
                                isSelected
                                    ? "bg-white/[0.03] border-white/20"
                                    : "bg-transparent border-transparent hover:bg-white/[0.02]"
                            )}
                        >
                            {compact ? (
                                <>
                                    <Icon className={cn("w-5 h-5 transition-colors",
                                        isSelected ? "text-white" : "text-text-tertiary group-hover:text-white"
                                    )} />
                                    <span className={cn("text-[10px] font-medium truncate w-full text-center leading-tight",
                                        isSelected ? "text-white" : "text-text-secondary"
                                    )}>
                                        {driver.label}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4 text-text-tertiary opacity-50" />
                                            <span className={cn("text-sm font-medium transition-colors", isSelected ? "text-white" : "text-text-secondary group-hover:text-white")}>
                                                {driver.label}
                                            </span>
                                        </div>
                                        <span className={cn(
                                            "px-0 py-0 text-[10px] font-mono uppercase tracking-widest",
                                            driver.scope.toLowerCase() === 'organization' ? "text-strain" :
                                                driver.scope.toLowerCase() === 'department' ? "text-withdrawal" :
                                                    "text-engagement"
                                        )}>
                                            {driver.scope}
                                        </span>
                                    </div>

                                    {/* Progress Bar with Orange->Red Fade */}
                                    <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${driver.score}%`,
                                                background: 'linear-gradient(90deg, #F97316 0%, #DC2626 100%)' // Orange-500 to Red-600
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </button>
                    );
                })}
            </div>

            {!compact && (
                <button className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary hover:text-white transition-colors mt-2 text-left pl-1 animate-in fade-in">
                    + View All Drivers
                </button>
            )}
        </div>
    );
}

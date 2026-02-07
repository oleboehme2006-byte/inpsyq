import React from 'react';
import { cn } from '@/lib/utils';

interface DriverDeepDiveProps {
    drivers: any[];
}

export function DriverDeepDive({ drivers }: DriverDeepDiveProps) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-semibold text-text-primary">Key Drivers</h3>
                <span className="text-xs font-mono text-text-tertiary">Contribution</span>
            </div>

            <div className="space-y-4">
                {drivers.map((driver, idx) => (
                    <div key={idx} className="group p-4 rounded-lg bg-bg-surface/20 border border-border/50 hover:bg-bg-surface/40 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-text-primary">{driver.label}</span>
                            <span className="px-2 py-0.5 bg-bg-elevated rounded border border-border text-[10px] font-mono text-text-tertiary uppercase">
                                {driver.scope}
                            </span>
                        </div>
                        <p className="text-xs text-text-tertiary mb-3">{driver.description}</p>

                        <div className="flex items-center justify-between gap-4">
                            <div className="relative flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                                <div
                                    className="absolute left-0 top-0 h-full bg-text-secondary rounded-full"
                                    style={{ width: `${driver.score}%` }} // Simplified, just grey bar as per screenshot 4 dark mode vibe
                                />
                            </div>
                            <span className="text-xs font-mono font-bold text-text-secondary">{driver.score}%</span>
                        </div>
                    </div>
                ))}
                <button className="text-xs text-text-tertiary hover:text-text-primary transition-colors">
                    Show 2 more
                </button>
            </div>
        </div>
    );
}

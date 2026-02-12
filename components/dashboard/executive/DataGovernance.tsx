import React from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck, Database, History, Activity } from 'lucide-react';

interface DataGovernanceProps {
    coverage?: number;
    dataQuality?: number;
    temporalStability?: number;
    signalConfidence?: number;
    totalSessions?: number;
    lastUpdated?: string;
}

export function DataGovernance({
    coverage = 91,
    dataQuality = 88,
    temporalStability = 81,
    signalConfidence = 75,
    totalSessions = 50,
    lastUpdated = 'Dec 24, 2025'
}: DataGovernanceProps) {
    return (
        <div className="w-full rounded-xl border border-white/10 bg-[#050505] p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-accent-primary" />
                    <h3 className="text-xl font-display font-medium text-white">Data Governance</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#845EEE]/10 border border-[#845EEE]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#845EEE] animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-[#845EEE] uppercase tracking-widest">High Confidence</span>
                </div>
            </div>

            {/* Grid for content */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">

                {/* Metric 1: Coverage */}
                <GovernanceMetric
                    label="Coverage"
                    value={coverage}
                    icon={<Database className="w-4 h-4" />}
                    color="engagement"
                />

                {/* Metric 2: Data Quality */}
                <GovernanceMetric
                    label="Data Quality"
                    value={dataQuality}
                    icon={<ShieldCheck className="w-4 h-4" />}
                    color="engagement"
                />

                {/* Metric 3: Temporal Stability */}
                <GovernanceMetric
                    label="Temporal Stability"
                    value={temporalStability}
                    icon={<History className="w-4 h-4" />}
                    color="engagement"
                />

                {/* Metric 4: Signal Confidence */}
                <GovernanceMetric
                    label="Signal Confidence"
                    value={signalConfidence}
                    icon={<Activity className="w-4 h-4" />}
                    color="signal"
                />

            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 text-xs text-text-tertiary font-mono">
                <div className="flex items-center gap-2">
                    <Database className="w-3 h-3" />
                    <span>{totalSessions} total sessions</span>
                </div>
                <div className="flex items-center gap-2">
                    <History className="w-3 h-3" />
                    <span>Last updated: {lastUpdated}</span>
                </div>
            </div>
        </div>
    );
}

function GovernanceMetric({ label, value, icon, color }: { label: string, value: number, icon: any, color: string }) {
    const isSignal = color === 'signal';
    const barColor = isSignal ? 'bg-[#845EEE]' : 'bg-engagement';
    const textColor = isSignal ? 'text-[#845EEE]' : 'text-engagement';

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
                    {icon}
                    {label}
                </div>
                <span className={cn("text-xs font-mono font-bold", textColor)}>{value}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", barColor)}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KPICardProps {
    id: string;
    label: string;
    value: string | number;
    trendValue: string; // e.g. "+12%"
    color: 'strain' | 'withdrawal' | 'trust-gap' | 'engagement';
    isActive?: boolean;
    onClick?: () => void;
}

export function KPICard({ id, label, value, trendValue, color, isActive, onClick }: KPICardProps) {
    const numericValue = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) : value;

    // Determine polarity: Engagement is Positive (High is Good), others Negative (Low is Good)
    const isPositiveMetric = id === 'engagement';

    // Helper to determine status props
    const getStatus = (val: number, isPos: boolean) => {
        // Thresholds
        // Positive: >75 Healthy, 50-75 Moderate, 25-50 Risky, <25 Critical
        // Negative: <25 Healthy, 25-50 Moderate, 50-75 Risky, >75 Critical

        let status = '';
        let statusColor = ''; // 'green', 'orange', 'red' representing variable names

        if (isPos) {
            if (val >= 75) { status = 'HEALTHY'; statusColor = 'engagement'; }
            else if (val >= 50) { status = 'MODERATE'; statusColor = 'engagement'; }
            else if (val >= 25) { status = 'RISKY'; statusColor = 'withdrawal'; }
            else { status = 'CRITICAL'; statusColor = 'strain'; }
        } else {
            if (val <= 25) { status = 'HEALTHY'; statusColor = 'engagement'; }
            else if (val <= 50) { status = 'MODERATE'; statusColor = 'engagement'; }
            else if (val <= 75) { status = 'RISKY'; statusColor = 'withdrawal'; }
            else { status = 'CRITICAL'; statusColor = 'strain'; }
        }
        return { status, statusColor };
    };

    const { status, statusColor } = getStatus(numericValue, isPositiveMetric);

    // Dynamic Tailwind classes for the badge
    const badgeStyles = {
        engagement: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20",
        withdrawal: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
        strain: "bg-[#E11D48]/10 text-[#E11D48] border-[#E11D48]/20"
    }[statusColor];

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left relative p-6 rounded-xl border transition-all duration-300 group overflow-hidden",
                "bg-[#050505]", // Strict dark surface
                isActive
                    ? `border-${color}`
                    : "border-white/10 hover:border-white/20 hover:bg-[#0A0A0A]"
            )}
            style={isActive ? { boxShadow: `0 0 20px rgba(var(--color-${color}),0.15)` } : undefined}
        >
            {/* Top Label Row */}
            <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-xs font-mono font-bold tracking-widest text-text-tertiary uppercase group-hover:text-text-secondary transition-colors">
                    {label}
                </span>

                {/* Status Badge */}
                <span className={cn(
                    "px-2 py-0.5 rounded-[4px] text-[10px] font-bold border uppercase tracking-wider",
                    badgeStyles
                )}>
                    {status}
                </span>
            </div>

            {/* Value & Trend Row */}
            <div className="relative z-10 space-y-1">
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-display font-medium text-white tracking-tighter">
                        {String(value).replace('%', '')}
                    </span>
                    {/* Removed the small % sign next to value if it was redundant, sticking to clean number */}
                </div>

                {/* Visual Trend (Percent Only) */}
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-sm font-medium",
                        trendValue.includes('+') && !isPositiveMetric ? "text-strain" :
                            trendValue.includes('-') && !isPositiveMetric ? "text-engagement" :
                                trendValue.includes('+') && isPositiveMetric ? "text-engagement" :
                                    "text-text-secondary"
                    )}>
                        {trendValue}
                    </span>
                </div>
            </div>

            {/* Active Indicator Glow */}
            {isActive && (
                <div className={cn(
                    "absolute inset-0 opacity-10 pointer-events-none",
                    `bg-${color}`
                )} />
            )}
        </button>
    );
}

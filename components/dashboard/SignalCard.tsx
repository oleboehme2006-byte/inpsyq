'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import {
    INDEX_DEFINITIONS,
    getQualitativeState,
    getQualitativeAdjective,
    getValueColorClass,
    getTrendClass,
    type QualitativeState
} from '@/lib/dashboard/indexSemantics';
import { safeToFixed, safeNumber } from '@/lib/utils/safeNumber';

// ==========================================
// Types
// ==========================================

export interface SignalCardProps {
    indexId: string;
    value: number;
    previousValue?: number;
    uncertainty?: number;
    trendVelocity?: number;  // Rate of change
    confidence?: number;     // 0-1 confidence in the measurement
    showTrend?: boolean;
    compact?: boolean;
    isActive?: boolean;      // For executive dashboard highlighting
    targetId?: string;       // Scroll target for navigation
    onClick?: () => void;
}

// ==========================================
// Color Map for Index Themes
// ==========================================

const INDEX_ACCENT_COLORS: Record<string, { border: string; glow: string; text: string }> = {
    strain_index: { border: 'border-strain', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]', text: 'text-strain' },
    withdrawal_risk: { border: 'border-withdrawal', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', text: 'text-withdrawal' },
    trust_gap: { border: 'border-trust-gap', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]', text: 'text-trust-gap' },
    engagement_index: { border: 'border-engagement', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', text: 'text-engagement' },
};

// ==========================================
// State Icons
// ==========================================

const StateIcon: React.FC<{ state: QualitativeState }> = ({ state }) => {
    switch (state) {
        case 'excellent':
        case 'good':
            return <CheckCircle className="w-4 h-4 text-engagement" />;
        case 'critical':
            return <AlertTriangle className="w-4 h-4 text-strain-high" />;
        case 'concerning':
            return <AlertCircle className="w-4 h-4 text-withdrawal" />;
        default:
            return null;
    }
};

// ==========================================
// Compact Trend Delta
// ==========================================

const TrendDelta: React.FC<{
    velocity: number;
    indexId: string;
}> = ({ velocity, indexId }) => {
    const trendClass = getTrendClass(indexId, velocity);
    const absVelocity = Math.abs(velocity);

    if (absVelocity < 0.005) {
        return <span className="text-xs text-text-tertiary">±0%</span>;
    }

    const sign = velocity > 0 ? '+' : '';
    return (
        <span className={`text-xs font-mono ${trendClass}`}>
            {sign}{safeToFixed(velocity * 100, 1)}%
        </span>
    );
};

// ==========================================
// Trend Indicator (Full)
// ==========================================

const TrendIndicator: React.FC<{
    velocity: number;
    indexId: string;
    compact?: boolean;
}> = ({ velocity, indexId, compact }) => {
    const trendClass = getTrendClass(indexId, velocity);
    const absVelocity = Math.abs(velocity);

    if (absVelocity < 0.01) {
        return (
            <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'} text-text-tertiary`}>
                <Minus className="w-3 h-3" />
                <span>Stable</span>
            </div>
        );
    }

    const isUp = velocity > 0;
    const Icon = isUp ? ArrowUp : ArrowDown;
    const def = INDEX_DEFINITIONS[indexId];

    // Determine if this trend is positive for this metric
    const isPositiveTrend = def?.directionality === 'higher_is_better' ? isUp : !isUp;

    return (
        <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'} ${trendClass}`}>
            <Icon className="w-3 h-3" />
            <span>{safeToFixed(absVelocity * 100, 1)}%</span>
            {!compact && (
                <span className="text-text-tertiary ml-1">
                    {isPositiveTrend ? 'improving' : 'worsening'}
                </span>
            )}
        </div>
    );
};

// ==========================================
// Uncertainty Band
// ==========================================

const UncertaintyBand: React.FC<{ uncertainty: number }> = ({ uncertainty }) => {
    const width = Math.max(5, uncertainty * 100);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            <motion.div
                className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-meta-muted to-transparent"
                style={{ width: `${width}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 0.5 }}
            />
        </div>
    );
};

// ==========================================
// Main Component
// ==========================================

function SignalCardComponent({
    indexId,
    value,
    previousValue,
    uncertainty = 0,
    trendVelocity,
    confidence = 1,
    showTrend = true,
    compact = false,
    isActive = false,
    targetId,
    onClick,
}: SignalCardProps) {
    const def = INDEX_DEFINITIONS[indexId];
    const safeValue = safeNumber(value);
    const accentColors = INDEX_ACCENT_COLORS[indexId] || INDEX_ACCENT_COLORS.strain_index;

    // Handle click with optional scroll
    const handleClick = () => {
        if (targetId) {
            const element = document.getElementById(targetId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        onClick?.();
    };

    const isClickable = !!targetId || !!onClick;

    const qualitativeState = useMemo(() =>
        getQualitativeState(indexId, safeValue),
        [indexId, safeValue]
    );

    const adjective = useMemo(() =>
        getQualitativeAdjective(indexId, safeValue),
        [indexId, safeValue]
    );

    const valueColorClass = useMemo(() =>
        getValueColorClass(indexId, safeValue),
        [indexId, safeValue]
    );

    // Calculate velocity from previous if not provided
    const velocity = useMemo(() => {
        if (trendVelocity !== undefined) return trendVelocity;
        if (previousValue !== undefined && previousValue !== 0) {
            return (safeValue - previousValue) / previousValue;
        }
        return 0;
    }, [trendVelocity, previousValue, safeValue]);

    if (!def) {
        return (
            <div className="signal-card opacity-50">
                <p className="text-text-tertiary">Unknown index: {indexId}</p>
            </div>
        );
    }

    // Build dynamic class for active state
    const activeClasses = isActive
        ? `${accentColors.border} ${accentColors.glow} border-2`
        : 'border border-border';

    // Hover classes: purple outline only on non-active, clickable cards
    const hoverClasses = isClickable && !isActive
        ? 'hover:border-meta/50 hover:shadow-glow-sm'
        : '';

    const titleColorClass = isActive ? accentColors.text : 'text-text-secondary';

    return (
        <motion.div
            className={`signal-card relative overflow-hidden ${activeClasses} ${hoverClasses} ${isClickable ? 'cursor-pointer' : ''}`}
            onClick={isClickable ? handleClick : undefined}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={isClickable ? { scale: 1.02 } : undefined}
        >
            {/* Uncertainty overlay */}
            {uncertainty > 0.1 && <UncertaintyBand uncertainty={uncertainty} />}

            {/* Content */}
            <div className="relative z-10">
                {/* Header - Compact version */}
                {compact ? (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-mono uppercase tracking-wider ${titleColorClass}`}>
                                {indexId === 'withdrawal_risk' ? 'Withdrawal Risk' : def.shortLabel}
                            </span>
                            <StateIcon state={qualitativeState} />
                        </div>

                        {/* Value + Qualitative Badge Inline */}
                        <div className="flex items-baseline gap-2 mb-1">
                            <span
                                className={`font-body font-semibold text-2xl ${valueColorClass}`}
                                style={{ opacity: Math.max(0.6, confidence) }}
                            >
                                {safeToFixed(safeValue * 100, 0)}%
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded border capitalize ${qualitativeState === 'critical' ? 'border-strain/50 text-strain bg-strain-muted/30' :
                                qualitativeState === 'concerning' ? 'border-withdrawal/50 text-withdrawal bg-withdrawal-muted/30' :
                                    qualitativeState === 'excellent' || qualitativeState === 'good' ? 'border-engagement/50 text-engagement bg-engagement-muted/30' :
                                        'border-border text-text-tertiary'
                                }`}>
                                {adjective}
                            </span>
                        </div>

                        {/* Trend Delta */}
                        <TrendDelta velocity={velocity} indexId={indexId} />
                    </>
                ) : (
                    <>
                        {/* Header - Full version */}
                        <div className="flex items-center justify-between mb-3">
                            <span className="section-subtitle">{def.shortLabel}</span>
                            <StateIcon state={qualitativeState} />
                        </div>

                        {/* Main Value */}
                        <div className="flex items-baseline gap-2 mb-2">
                            <span
                                className={`font-body font-semibold text-4xl ${valueColorClass}`}
                                style={{ opacity: Math.max(0.6, confidence) }}
                            >
                                {safeToFixed(safeValue * 100, 0)}
                            </span>
                            <span className="text-text-tertiary text-sm font-mono">%</span>
                        </div>

                        {/* Qualitative State */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`badge ${qualitativeState === 'critical' ? 'badge-critical' :
                                qualitativeState === 'concerning' ? 'badge-warning' :
                                    qualitativeState === 'excellent' || qualitativeState === 'good' ? 'badge-healthy' :
                                        'badge-neutral'
                                }`}>
                                {adjective}
                            </span>

                            {confidence < 0.7 && (
                                <span className="text-xs text-meta">
                                    Low confidence
                                </span>
                            )}
                        </div>

                        {/* Trend */}
                        {showTrend && (
                            <TrendIndicator
                                velocity={velocity}
                                indexId={indexId}
                                compact={compact}
                            />
                        )}

                        {/* Hover Tooltip Content */}
                        <div className="mt-4 pt-3 border-t border-border/30">
                            <p className="text-xs text-text-tertiary leading-relaxed">
                                {def.businessMeaning}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}

export const SignalCard = memo(SignalCardComponent);

// ==========================================
// Grid Layout Helper
// ==========================================

export interface SignalGridProps {
    children: React.ReactNode;
    columns?: 2 | 3 | 4 | 5;
}

export const SignalGrid: React.FC<SignalGridProps> = ({
    children,
    columns = 4
}) => {
    const gridClass = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    }[columns];

    return (
        <div className={`grid gap-6 ${gridClass}`}>
            {children}
        </div>
    );
};

'use client';

import React from 'react';
import { TrendBlock as TrendBlockType, TrendRegime } from '@/lib/dashboard/types';
import { safeToFixed } from '@/lib/utils/safeNumber';

interface TrendBlockProps {
    trend: TrendBlockType;
    history?: { week_start: string; strain?: number; withdrawal?: number }[];
}

const DIRECTION_ICONS: Record<string, { icon: string; color: string }> = {
    IMPROVING: { icon: '↑', color: 'text-green-400' },
    STABLE: { icon: '→', color: 'text-slate-400' },
    DETERIORATING: { icon: '↓', color: 'text-red-400' },
};

const REGIME_LABELS: Record<TrendRegime, { label: string; color: string }> = {
    stable: { label: 'Stable Pattern', color: 'text-green-400' },
    shift: { label: 'Regime Shift', color: 'text-amber-400' },
    noise: { label: 'Noisy Signal', color: 'text-slate-500' },
};

export default function TrendBlock({ trend, history = [] }: TrendBlockProps) {
    const directionInfo = DIRECTION_ICONS[trend.direction] || DIRECTION_ICONS.STABLE;
    const regimeInfo = REGIME_LABELS[trend.regime];

    // Simple bar chart visualization
    const maxValue = Math.max(...history.map(h => h.strain || 0), 0.1);

    return (
        <div className="flex flex-col h-full">
            {/* Direction & Velocity */}
            <div className="flex items-center gap-4 mb-4">
                <div className={`text-4xl ${directionInfo.color}`}>
                    {directionInfo.icon}
                </div>
                <div>
                    <div className={`text-xl font-bold ${directionInfo.color}`}>
                        {trend.direction}
                    </div>
                    <div className="text-xs text-slate-500">
                        Velocity: {safeToFixed(Math.abs(trend.velocity) * 100, 1)}%/wk
                    </div>
                </div>
                <div className="ml-auto text-right">
                    <div className={`text-sm font-medium ${regimeInfo.color}`}>
                        {regimeInfo.label}
                    </div>
                    <div className="text-xs text-slate-500">
                        Volatility: {safeToFixed(trend.volatility * 100, 0)}%
                    </div>
                </div>
            </div>

            {/* Mini Chart */}
            {history.length > 0 ? (
                <div className="flex-grow flex items-end gap-1 pt-4 border-t border-slate-800/50">
                    {history.slice(-12).map((h, i) => {
                        const height = ((h.strain || 0) / maxValue) * 100;
                        const isRecent = i >= history.length - 3;
                        return (
                            <div
                                key={h.week_start}
                                className="flex-1 flex flex-col items-center"
                            >
                                <div
                                    className={`w-full rounded-t transition-all ${isRecent ? 'bg-purple-500' : 'bg-slate-700'}`}
                                    style={{ height: `${Math.max(height, 5)}%`, minHeight: '4px' }}
                                />
                                {i % 3 === 0 && (
                                    <span className="text-[8px] text-slate-600 mt-1">
                                        W{i + 1}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center text-slate-600 text-sm italic">
                    No historical data available
                </div>
            )}

            {/* Explanation */}
            {trend.explanation && (
                <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-800/50">
                    {trend.explanation}
                </p>
            )}
        </div>
    );
}

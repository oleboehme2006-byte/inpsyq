'use client';

import React, { memo, useMemo } from 'react';
import { safeNumber } from '@/lib/utils/safeNumber';

export interface UncertaintyBandProps {
    /** Time series data points */
    data: Array<{
        time: string | Date;
        mean: number;
        lower: number;
        upper: number;
    }>;
    /** Height in pixels */
    height?: number;
    /** Color theme */
    theme?: 'strain' | 'trust' | 'engagement' | 'withdrawal' | 'neutral';
    /** Show volatility encoding (line noise) */
    showVolatility?: boolean;
    /** Label (subtle) */
    label?: string;
    /** Explainability token */
    explainToken?: string;
}

const THEME_COLORS = {
    strain: { line: '#ef4444', band: 'rgba(239, 68, 68, 0.2)' },
    trust: { line: '#3b82f6', band: 'rgba(59, 130, 246, 0.2)' },
    engagement: { line: '#10b981', band: 'rgba(16, 185, 129, 0.2)' },
    withdrawal: { line: '#f59e0b', band: 'rgba(245, 158, 11, 0.2)' },
    neutral: { line: '#6b7280', band: 'rgba(107, 114, 128, 0.2)' },
};

/**
 * UncertaintyBand - Time series with confidence bands
 * 
 * Visual Encoding:
 * - Line position = μ (mean)
 * - Band width = σ (uncertainty)
 * - Line opacity = certainty
 */
function UncertaintyBandComponent({
    data,
    height = 120,
    theme = 'neutral',
    showVolatility = true,
    label,
    explainToken,
}: UncertaintyBandProps) {
    const colors = THEME_COLORS[theme];

    const { pathMean, pathUpper, pathLower, pathBand, maxUncertainty } = useMemo(() => {
        if (data.length === 0) {
            return { pathMean: '', pathUpper: '', pathLower: '', pathBand: '', maxUncertainty: 0 };
        }

        const width = 100; // percentage
        const padding = 10;
        const chartHeight = height - padding * 2;

        // Find min/max for scaling
        const allValues = data.flatMap(d => [d.mean, d.lower, d.upper]);
        const minVal = Math.min(...allValues.map(v => safeNumber(v)));
        const maxVal = Math.max(...allValues.map(v => safeNumber(v)));
        const range = maxVal - minVal || 1;

        // Calculate max uncertainty for opacity encoding
        const uncertainties = data.map(d => safeNumber(d.upper) - safeNumber(d.lower));
        const maxUnc = Math.max(...uncertainties);

        // Generate paths
        const stepX = width / (data.length - 1 || 1);

        const toY = (val: number) => {
            const normalized = (safeNumber(val) - minVal) / range;
            return padding + chartHeight * (1 - normalized);
        };

        let meanPath = '';
        let upperPath = '';
        let lowerPath = '';

        data.forEach((d, i) => {
            const x = i * stepX;
            const yMean = toY(d.mean);
            const yUpper = toY(d.upper);
            const yLower = toY(d.lower);

            if (i === 0) {
                meanPath = `M ${x} ${yMean}`;
                upperPath = `M ${x} ${yUpper}`;
                lowerPath = `M ${x} ${yLower}`;
            } else {
                meanPath += ` L ${x} ${yMean}`;
                upperPath += ` L ${x} ${yUpper}`;
                lowerPath += ` L ${x} ${yLower}`;
            }
        });

        // Create closed band path
        const bandPath = upperPath + ' ' +
            data.map((d, i) => {
                const x = (data.length - 1 - i) * stepX;
                const y = toY(data[data.length - 1 - i].lower);
                return `L ${x} ${y}`;
            }).join(' ') + ' Z';

        return {
            pathMean: meanPath,
            pathUpper: upperPath,
            pathLower: lowerPath,
            pathBand: bandPath,
            maxUncertainty: maxUnc,
        };
    }, [data, height]);

    // Calculate average certainty for line opacity
    const avgCertainty = useMemo(() => {
        if (data.length === 0) return 1;
        const avgUncertainty = data.reduce((sum, d) => {
            return sum + (safeNumber(d.upper) - safeNumber(d.lower));
        }, 0) / data.length;
        return Math.max(0.4, 1 - avgUncertainty / 2);
    }, [data]);

    if (data.length === 0) {
        return (
            <div
                className="flex items-center justify-center text-slate-600 text-sm italic"
                style={{ height }}
            >
                Insufficient data
            </div>
        );
    }

    return (
        <div
            className="relative w-full"
            style={{ height }}
            data-explain-token={explainToken}
        >
            <svg
                viewBox={`0 0 100 ${height}`}
                preserveAspectRatio="none"
                className="w-full h-full"
            >
                {/* Uncertainty Band */}
                <path
                    d={pathBand}
                    fill={colors.band}
                    className="transition-all duration-500"
                />

                {/* Mean Line */}
                <path
                    d={pathMean}
                    fill="none"
                    stroke={colors.line}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: avgCertainty }}
                    className="transition-all duration-500"
                />

                {/* Volatility Noise (optional) */}
                {showVolatility && maxUncertainty > 0.3 && (
                    <path
                        d={pathMean}
                        fill="none"
                        stroke={colors.line}
                        strokeWidth="0.5"
                        strokeDasharray="2 2"
                        style={{ opacity: 0.3 }}
                    />
                )}
            </svg>

            {/* Label */}
            {label && (
                <div className="absolute bottom-1 left-2 text-[9px] uppercase tracking-widest text-slate-600 font-light">
                    {label}
                </div>
            )}

            {/* Time markers (subtle) */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[8px] text-slate-700">
                {data.length > 0 && (
                    <>
                        <span>W1</span>
                        <span>W{Math.ceil(data.length / 2)}</span>
                        <span>W{data.length}</span>
                    </>
                )}
            </div>
        </div>
    );
}

export const UncertaintyBand = memo(UncertaintyBandComponent);

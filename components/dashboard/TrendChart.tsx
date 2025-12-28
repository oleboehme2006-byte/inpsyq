'use client';

import React, { memo, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import {
    INDEX_DEFINITIONS,
    getQualitativeAdjective,
    getValueColorClass,
} from '@/lib/dashboard/indexSemantics';
import { safeToFixed, safeNumber } from '@/lib/utils/safeNumber';

// ==========================================
// Types
// ==========================================

export interface TrendDataPoint {
    week: string;     // Week label (e.g., "W1", "Dec 16")
    value: number;    // Mean value
    lower?: number;   // Lower uncertainty bound
    upper?: number;   // Upper uncertainty bound
}

export interface TrendChartProps {
    indexId: string;
    data: TrendDataPoint[];
    height?: number;
    showUncertainty?: boolean;
    showSemanticAxis?: boolean;
    highlightLatest?: boolean;
}

// ==========================================
// Theme Colors
// ==========================================

const THEME_COLORS: Record<string, { line: string; fill: string; band: string }> = {
    strain: {
        line: '#ef4444',
        fill: 'rgba(239, 68, 68, 0.15)',
        band: 'rgba(239, 68, 68, 0.1)',
    },
    withdrawal: {
        line: '#f59e0b',
        fill: 'rgba(245, 158, 11, 0.15)',
        band: 'rgba(245, 158, 11, 0.1)',
    },
    'trust-gap': {
        line: '#06b6d4',
        fill: 'rgba(6, 182, 212, 0.15)',
        band: 'rgba(6, 182, 212, 0.1)',
    },
    engagement: {
        line: '#10b981',
        fill: 'rgba(16, 185, 129, 0.15)',
        band: 'rgba(16, 185, 129, 0.1)',
    },
    meta: {
        line: '#8b5cf6',
        fill: 'rgba(139, 92, 246, 0.15)',
        band: 'rgba(139, 92, 246, 0.1)',
    },
};

// ==========================================
// Custom Tooltip
// ==========================================

interface TooltipPayload {
    payload: TrendDataPoint;
}

const CustomTooltip: React.FC<{
    active?: boolean;
    payload?: TooltipPayload[];
    indexId: string;
}> = ({ active, payload, indexId }) => {
    if (!active || !payload?.[0]) return null;

    const data = payload[0].payload;
    const value = safeNumber(data.value);
    const adjective = getQualitativeAdjective(indexId, value);
    const colorClass = getValueColorClass(indexId, value);
    const def = INDEX_DEFINITIONS[indexId];

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-surface border border-border rounded-lg p-3 shadow-glow-sm"
        >
            <p className="text-xs text-text-tertiary font-mono mb-1">{data.week}</p>
            <p className={`text-lg font-semibold ${colorClass}`}>
                {safeToFixed(value * 100, 1)}%
            </p>
            <p className="text-sm text-text-secondary capitalize">{adjective}</p>
            {data.lower !== undefined && data.upper !== undefined && (
                <p className="text-xs text-text-tertiary mt-1">
                    Range: {safeToFixed(data.lower * 100, 0)}% - {safeToFixed(data.upper * 100, 0)}%
                </p>
            )}
        </motion.div>
    );
};

// ==========================================
// Semantic Y-Axis
// ==========================================

// Generate semantic tick values based on index thresholds
const getSemanticTicks = (indexId: string): number[] => {
    const def = INDEX_DEFINITIONS[indexId];
    if (!def) return [0, 0.25, 0.5, 0.75, 1];

    const { thresholds } = def;
    return [
        thresholds.excellent,
        thresholds.good,
        thresholds.concerning,
        thresholds.critical,
    ].sort((a, b) => a - b);
};

const SemanticAxisTick: React.FC<{
    x?: number;
    y?: number;
    payload?: { value: number };
    indexId: string;
}> = ({ x, y, payload, indexId }) => {
    if (!payload || x === undefined || y === undefined) return null;

    const def = INDEX_DEFINITIONS[indexId];
    if (!def) return null;

    const value = payload.value;
    const { thresholds, directionality } = def;

    // Map value to label based on thresholds
    let label = '';
    let colorClass = 'fill-text-tertiary';
    const tolerance = 0.001;

    if (Math.abs(value - thresholds.critical) < tolerance) {
        label = 'Critical';
        colorClass = 'fill-strain';
    } else if (Math.abs(value - thresholds.concerning) < tolerance) {
        label = 'Risk';
        colorClass = 'fill-withdrawal';
    } else if (Math.abs(value - thresholds.good) < tolerance) {
        label = 'Good';
        colorClass = 'fill-engagement/70';
    } else if (Math.abs(value - thresholds.excellent) < tolerance) {
        label = 'Optimal';
        colorClass = 'fill-engagement';
    }

    if (!label) return null;

    return (
        <text
            x={x - 8}
            y={y}
            textAnchor="end"
            dominantBaseline="middle"
            className={`text-xs font-mono ${colorClass}`}
        >
            {label}
        </text>
    );
};

// ==========================================
// Main Component
// ==========================================

function TrendChartComponent({
    indexId,
    data,
    height = 200,
    showUncertainty = true,
    showSemanticAxis = true,
    highlightLatest = true,
}: TrendChartProps) {
    const def = INDEX_DEFINITIONS[indexId];
    const colors = THEME_COLORS[def?.colorTheme || 'meta'];

    // Calculate domain with padding
    const { minValue, maxValue } = useMemo(() => {
        const values = data.flatMap(d => [
            d.value,
            d.lower ?? d.value,
            d.upper ?? d.value
        ]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const padding = (max - min) * 0.1;
        return {
            minValue: Math.max(0, min - padding),
            maxValue: Math.min(1, max + padding),
        };
    }, [data]);

    // Reference lines for thresholds
    const thresholdLines = useMemo(() => {
        if (!def || !showSemanticAxis) return [];

        const { thresholds, directionality } = def;
        const lines: { y: number; color: string; label: string; dashed: boolean }[] = [];

        // Add concerning threshold (Risk line)
        if (thresholds.concerning >= minValue && thresholds.concerning <= maxValue) {
            lines.push({
                y: thresholds.concerning,
                color: directionality === 'higher_is_worse' ? '#f59e0b' : '#ef4444',
                label: 'Risk',
                dashed: true,
            });
        }

        // Add critical threshold
        if (thresholds.critical >= minValue && thresholds.critical <= maxValue) {
            lines.push({
                y: thresholds.critical,
                color: '#ef4444',
                label: 'Critical',
                dashed: true,
            });
        }

        return lines;
    }, [def, minValue, maxValue, showSemanticAxis]);

    // Get semantic tick values
    const semanticTicks = useMemo(() => {
        if (!showSemanticAxis) return undefined;
        return getSemanticTicks(indexId).filter(t => t >= minValue && t <= maxValue);
    }, [indexId, showSemanticAxis, minValue, maxValue]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-text-tertiary">
                No trend data available
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full"
        >
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: showSemanticAxis ? 50 : 10, bottom: 0 }}
                >
                    {/* Grid */}
                    <defs>
                        <linearGradient id={`gradient-${indexId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors.line} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={colors.line} stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    {/* X Axis */}
                    <XAxis
                        dataKey="week"
                        tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'Roboto Mono' }}
                        axisLine={{ stroke: '#27272a' }}
                        tickLine={{ stroke: '#27272a' }}
                    />

                    {/* Y Axis */}
                    <YAxis
                        domain={[minValue, maxValue]}
                        ticks={semanticTicks}
                        tick={showSemanticAxis
                            ? (props) => <SemanticAxisTick {...props} indexId={indexId} />
                            : { fill: '#64748b', fontSize: 12, fontFamily: 'Roboto Mono' }
                        }
                        axisLine={{ stroke: '#27272a' }}
                        tickLine={{ stroke: '#27272a' }}
                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                        width={showSemanticAxis ? 55 : 40}
                    />

                    {/* Tooltip */}
                    <Tooltip
                        content={<CustomTooltip indexId={indexId} />}
                        cursor={{ stroke: '#3f3f46', strokeWidth: 1 }}
                    />

                    {/* Reference Lines */}
                    {thresholdLines.map((line, i) => (
                        <ReferenceLine
                            key={i}
                            y={line.y}
                            stroke={line.color}
                            strokeDasharray="4 4"
                            strokeOpacity={0.5}
                        />
                    ))}

                    {/* Uncertainty Band */}
                    {showUncertainty && data[0]?.lower !== undefined && (
                        <Area
                            type="monotone"
                            dataKey="upper"
                            stroke="none"
                            fill={colors.band}
                            fillOpacity={1}
                            baseValue="dataMin"
                        />
                    )}

                    {/* Main Line */}
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={colors.line}
                        strokeWidth={2}
                        fill={`url(#gradient-${indexId})`}
                        dot={highlightLatest ? {
                            r: 0,
                        } : false}
                        activeDot={{
                            r: 6,
                            stroke: colors.line,
                            strokeWidth: 2,
                            fill: '#0a0a0b',
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </motion.div>
    );
}

export const TrendChart = memo(TrendChartComponent);

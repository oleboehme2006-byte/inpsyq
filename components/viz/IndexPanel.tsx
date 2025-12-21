'use client';

import React, { memo } from 'react';
import { LatentField } from './LatentField';
import { safeNumber } from '@/lib/utils/safeNumber';

export interface IndexPanelProps {
    /** Index name (subtle label) */
    name: string;
    /** Mean value 0-1 */
    mean: number;
    /** Uncertainty 0-1 */
    uncertainty: number;
    /** Trend -1 to 1 */
    trend?: number;
    /** Volatility 0-1 */
    volatility?: number;
    /** Theme color */
    theme?: 'strain' | 'trust' | 'engagement' | 'withdrawal' | 'neutral';
    /** Explainability */
    explainToken?: string;
    constructIds?: string[];
}

/**
 * IndexPanel - Large-format index display with latent field
 * Wraps LatentField with additional context layer
 */
function IndexPanelComponent({
    name,
    mean,
    uncertainty,
    trend = 0,
    volatility = 0,
    theme = 'neutral',
    explainToken,
    constructIds = [],
}: IndexPanelProps) {
    const safeMean = safeNumber(mean);
    const safeUncertainty = safeNumber(uncertainty);
    const safeTrend = safeNumber(trend);

    // Semantic state label (no good/bad, just descriptive)
    const getStateLabel = () => {
        if (safeMean > 0.7) return 'elevated';
        if (safeMean > 0.4) return 'moderate';
        if (safeMean > 0.2) return 'low';
        return 'minimal';
    };

    // Trend label
    const getTrendLabel = () => {
        if (Math.abs(safeTrend) < 0.1) return 'stable';
        return safeTrend > 0 ? 'rising' : 'declining';
    };

    return (
        <div
            className="flex flex-col items-center p-4"
            data-explain-token={explainToken}
            data-construct-ids={constructIds.join(',')}
        >
            <LatentField
                mean={mean}
                uncertainty={uncertainty}
                trend={trend}
                volatility={volatility}
                theme={theme}
                size={140}
            />

            {/* Subtle metadata */}
            <div className="mt-4 text-center">
                <div className="text-[10px] uppercase tracking-[0.25em] text-slate-600 mb-1">
                    {name}
                </div>
                <div className="text-[9px] text-slate-700 space-x-3">
                    <span>{getStateLabel()}</span>
                    <span>·</span>
                    <span>{getTrendLabel()}</span>
                </div>
            </div>
        </div>
    );
}

export const IndexPanel = memo(IndexPanelComponent);

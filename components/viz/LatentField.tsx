'use client';

import React, { memo, useMemo } from 'react';
import { safeToFixed, safeNumber } from '@/lib/utils/safeNumber';

export interface LatentFieldProps {
    /** Mean value (μ) - determines position/intensity, 0-1 scale */
    mean: number;
    /** Uncertainty (σ) - determines halo radius, 0-1 scale */
    uncertainty: number;
    /** Trend (Δμ/Δt) - determines drift direction, -1 to 1 */
    trend?: number;
    /** Volatility - determines pulse irregularity, 0-1 */
    volatility?: number;
    /** Label (subtle, non-directive) */
    label?: string;
    /** Size in pixels */
    size?: number;
    /** Color theme */
    theme?: 'strain' | 'trust' | 'engagement' | 'withdrawal' | 'neutral';
    /** Explainability token */
    explainToken?: string;
    /** Construct IDs for traceability */
    constructIds?: string[];
}

const THEME_COLORS = {
    strain: { core: '#ef4444', halo: 'rgba(239, 68, 68, 0.15)', ring: 'rgba(239, 68, 68, 0.4)' },
    trust: { core: '#3b82f6', halo: 'rgba(59, 130, 246, 0.15)', ring: 'rgba(59, 130, 246, 0.4)' },
    engagement: { core: '#10b981', halo: 'rgba(16, 185, 129, 0.15)', ring: 'rgba(16, 185, 129, 0.4)' },
    withdrawal: { core: '#f59e0b', halo: 'rgba(245, 158, 11, 0.15)', ring: 'rgba(245, 158, 11, 0.4)' },
    neutral: { core: '#6b7280', halo: 'rgba(107, 114, 128, 0.15)', ring: 'rgba(107, 114, 128, 0.4)' },
};

/**
 * LatentField - Circular field representation of a latent psychological state
 * 
 * Visual Encoding:
 * - Core intensity = μ (mean)
 * - Halo radius = σ (uncertainty)  
 * - Drift animation = Δμ/Δt (trend)
 * - Pulse irregularity = volatility
 */
function LatentFieldComponent({
    mean,
    uncertainty,
    trend = 0,
    volatility = 0,
    label,
    size = 160,
    theme = 'neutral',
    explainToken,
    constructIds = [],
}: LatentFieldProps) {
    const colors = THEME_COLORS[theme];

    const safeMean = safeNumber(mean);
    const safeUncertainty = safeNumber(uncertainty);
    const safeTrend = safeNumber(trend);
    const safeVolatility = safeNumber(volatility);

    // Core size based on mean (higher mean = larger core)
    const coreSize = useMemo(() => {
        return Math.max(20, safeMean * size * 0.4);
    }, [safeMean, size]);

    // Halo size based on uncertainty (higher uncertainty = larger halo)
    const haloSize = useMemo(() => {
        return coreSize + (safeUncertainty * size * 0.5);
    }, [coreSize, safeUncertainty, size]);

    // Animation duration based on volatility (higher volatility = faster/irregular pulse)
    const pulseDuration = useMemo(() => {
        const base = 4; // seconds
        const variance = safeVolatility * 2;
        return base - variance;
    }, [safeVolatility]);

    // Trend offset for drift animation
    const trendOffset = useMemo(() => {
        return safeTrend * 8; // pixels
    }, [safeTrend]);

    // Check for reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    return (
        <div
            className="relative flex flex-col items-center justify-center"
            style={{ width: size, height: size + 40 }}
            data-explain-token={explainToken}
            data-construct-ids={constructIds.join(',')}
        >
            {/* Outer Halo (Uncertainty) */}
            <div
                className="absolute rounded-full transition-all duration-1000"
                style={{
                    width: haloSize,
                    height: haloSize,
                    background: `radial-gradient(circle, ${colors.halo} 0%, transparent 70%)`,
                    animation: prefersReducedMotion ? 'none' : `latentPulse ${pulseDuration}s ease-in-out infinite`,
                    transform: `translateX(${trendOffset}px)`,
                }}
            />

            {/* Uncertainty Ring */}
            <div
                className="absolute rounded-full border transition-all duration-700"
                style={{
                    width: haloSize * 0.85,
                    height: haloSize * 0.85,
                    borderColor: colors.ring,
                    borderWidth: 1 + safeUncertainty * 2,
                    opacity: 0.3 + safeUncertainty * 0.4,
                    transform: `translateX(${trendOffset}px)`,
                }}
            />

            {/* Core (Mean) */}
            <div
                className="absolute rounded-full transition-all duration-500"
                style={{
                    width: coreSize,
                    height: coreSize,
                    background: `radial-gradient(circle at 30% 30%, ${colors.core}, ${colors.core}88)`,
                    boxShadow: `0 0 ${10 + safeMean * 20}px ${colors.core}44`,
                    transform: `translateX(${trendOffset}px)`,
                }}
            />

            {/* Trend Indicator */}
            {Math.abs(safeTrend) > 0.1 && (
                <div
                    className="absolute text-xs opacity-40"
                    style={{
                        top: size / 2 - 6,
                        left: safeTrend > 0 ? size - 20 : 8,
                    }}
                >
                    {safeTrend > 0 ? '→' : '←'}
                </div>
            )}

            {/* Label (subtle) */}
            {label && (
                <div
                    className="absolute bottom-0 text-[10px] uppercase tracking-widest text-slate-500 font-light"
                    style={{ letterSpacing: '0.2em' }}
                >
                    {label}
                </div>
            )}

            {/* Keyframes */}
            <style jsx>{`
                @keyframes latentPulse {
                    0%, 100% { transform: translateX(${trendOffset}px) scale(1); opacity: 0.8; }
                    50% { transform: translateX(${trendOffset}px) scale(${1 + safeVolatility * 0.15}); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

export const LatentField = memo(LatentFieldComponent);

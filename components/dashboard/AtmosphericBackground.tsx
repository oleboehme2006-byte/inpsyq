'use client';

import React, { memo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// ==========================================
// Atmospheric Background
// ==========================================
// Creates a subtle, non-repeating animated background
// with blurred gradients suggesting latent psychological dynamics.
// 
// Design goals:
// - Near-black base
// - Blue/purple latent-field visuals
// - Slow, continuous, non-repeating motion
// - Low contrast, never distracting
// ==========================================

export interface AtmosphericBackgroundProps {
    /** Intensity of the effect (0-1) */
    intensity?: number;
    /** Whether to show the grid overlay */
    showGrid?: boolean;
    /** Custom primary color (default: violet) */
    primaryColor?: string;
    /** Custom secondary color (default: cyan) */
    secondaryColor?: string;
}

function AtmosphericBackgroundComponent({
    intensity = 0.6,
    showGrid = true,
    primaryColor = 'rgba(139, 92, 246, 0.15)',
    secondaryColor = 'rgba(6, 182, 212, 0.08)',
}: AtmosphericBackgroundProps) {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const scaledIntensity = Math.max(0.1, Math.min(1, intensity));

    if (prefersReducedMotion) {
        // Static version for reduced motion
        return (
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        background: `
              radial-gradient(ellipse 80% 50% at 30% 30%, ${primaryColor}, transparent 60%),
              radial-gradient(ellipse 60% 40% at 70% 70%, ${secondaryColor}, transparent 50%)
            `,
                        opacity: scaledIntensity,
                    }}
                />
                {showGrid && (
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `
                linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
              `,
                            backgroundSize: '60px 60px',
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Primary Gradient Blob (Top Left) */}
            <motion.div
                className="absolute"
                style={{
                    top: '-20%',
                    left: '-10%',
                    width: '70vw',
                    height: '70vw',
                    background: `radial-gradient(ellipse at center, ${primaryColor}, transparent 60%)`,
                    filter: 'blur(80px)',
                }}
                animate={{
                    x: [0, 30, -20, 0],
                    y: [0, -20, 30, 0],
                    scale: [1, 1.1, 0.95, 1],
                    opacity: [scaledIntensity * 0.8, scaledIntensity, scaledIntensity * 0.7, scaledIntensity * 0.8],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    times: [0, 0.33, 0.66, 1],
                }}
            />

            {/* Secondary Gradient Blob (Bottom Right) */}
            <motion.div
                className="absolute"
                style={{
                    bottom: '-15%',
                    right: '-10%',
                    width: '60vw',
                    height: '60vw',
                    background: `radial-gradient(ellipse at center, ${secondaryColor}, transparent 55%)`,
                    filter: 'blur(100px)',
                }}
                animate={{
                    x: [0, -40, 20, 0],
                    y: [0, 30, -15, 0],
                    scale: [1, 0.9, 1.15, 1],
                    opacity: [scaledIntensity * 0.6, scaledIntensity * 0.8, scaledIntensity * 0.5, scaledIntensity * 0.6],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    times: [0, 0.33, 0.66, 1],
                    delay: 5,
                }}
            />

            {/* Tertiary Subtle Accent (Center) */}
            <motion.div
                className="absolute"
                style={{
                    top: '30%',
                    left: '40%',
                    width: '40vw',
                    height: '40vw',
                    background: `radial-gradient(circle at center, rgba(139, 92, 246, 0.05), transparent 50%)`,
                    filter: 'blur(60px)',
                }}
                animate={{
                    x: [-20, 40, -30, -20],
                    y: [20, -30, 10, 20],
                    scale: [0.8, 1.2, 0.9, 0.8],
                    opacity: [0.3 * scaledIntensity, 0.5 * scaledIntensity, 0.4 * scaledIntensity, 0.3 * scaledIntensity],
                }}
                transition={{
                    duration: 35,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 10,
                }}
            />

            {/* Grid Overlay */}
            {showGrid && (
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
              linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
            `,
                        backgroundSize: '60px 60px',
                        opacity: 0.5,
                    }}
                />
            )}

            {/* Vignette */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(10, 10, 11, 0.8) 100%)',
                }}
            />
        </div>
    );
}

export const AtmosphericBackground = memo(AtmosphericBackgroundComponent);

// ==========================================
// Dashboard Background Wrapper
// ==========================================

export interface DashboardBackgroundProps {
    children: React.ReactNode;
    intensity?: number;
}

export const DashboardBackground: React.FC<DashboardBackgroundProps> = ({
    children,
    intensity = 0.5
}) => {
    return (
        <div className="relative min-h-screen bg-bg-base">
            <AtmosphericBackground intensity={intensity} />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

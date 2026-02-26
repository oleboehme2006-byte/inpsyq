'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
    durationMs?: number;
}

export function LoadingScreen({ durationMs = 1800 }: LoadingScreenProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        const fadeTimer = setTimeout(() => {
            setIsVisible(false);
        }, durationMs);

        const removeTimer = setTimeout(() => {
            setShouldRender(false);
        }, durationMs + 1000); // 1s for fade-out transition

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, [durationMs]);

    if (!shouldRender) return null;

    return (
        <div
            className={cn(
                'fixed inset-0 z-[100] bg-black flex items-center justify-center transition-opacity duration-700',
                isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
        >
            {/* inPsyq wordmark */}
            <div className="relative inline-block">
                <span className="text-4xl font-display font-semibold text-white tracking-tight">
                    inPsyq
                </span>
                {/* Animated violet underline */}
                <div
                    className="absolute -bottom-1 left-0 h-[3px] bg-[#8B5CF6] rounded-full shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                    style={{
                        animation: 'loader-bar 1.6s ease-in-out infinite',
                    }}
                />
            </div>

            <style>{`
                @keyframes loader-bar {
                    0%   { width: 0%;   opacity: 1; }
                    60%  { width: 100%; opacity: 1; }
                    100% { width: 100%; opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}

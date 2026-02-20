'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function LoadingSplash() {
    const [isVisible, setIsVisible] = useState(true);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        // Only run the splash screen once per browser session
        const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');

        if (hasSeenSplash) {
            setIsVisible(false);
            return;
        }

        // Set the flag so it doesn't run again this session
        sessionStorage.setItem('hasSeenSplash', 'true');

        // The video is exactly 2 seconds long.
        // We start the fade out precisely at 2000ms.
        const fadeTimer = setTimeout(() => {
            setIsFading(true);
        }, 2000);

        // Remove from DOM after the fade-out duration (700ms)
        const unmountTimer = setTimeout(() => {
            setIsVisible(false);
        }, 2700);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(unmountTimer);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] bg-black flex items-center justify-center transition-opacity duration-700 ease-in-out",
                isFading ? "opacity-0" : "opacity-100"
            )}
        >
            <video
                src="/loading.mp4"
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                onEnded={() => setIsFading(true)} // Fallback in case playback completes before the 2s timer
            />
        </div>
    );
}

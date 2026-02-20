'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function LoadingOverlay() {
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // Prevent hydration mismatch by only rendering the video placeholder on client
    // and starting the exact sequence
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleVideoEnd = () => {
        setIsFadingOut(true);
        // Clean up DOM after fade transition completes (500ms)
        setTimeout(() => {
            setIsComplete(true);
        }, 500);
    };

    if (!isMounted || isComplete) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500",
                isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
        >
            <video
                src="/loading.mp4"
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={handleVideoEnd}
                className="w-full h-full object-cover"
            // object-cover ensures it fills the screen, or object-contain if the video aspect ratio must be strictly preserved.
            // Assuming it's a splash logo animation, cover is usually best or contain if it has a black background itself. 
            />
        </div>
    );
}

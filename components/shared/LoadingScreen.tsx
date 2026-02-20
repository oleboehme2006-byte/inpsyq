'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
    durationMs?: number; // Optional safety timeout duration
}

export function LoadingScreen({ durationMs = 8000 }: LoadingScreenProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isMounted, setIsMounted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Prevent scrolling while loading
        if (isVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isVisible]);

    const [hasFaded, setHasFaded] = useState(false);

    const handleFadeOut = React.useCallback(() => {
        if (hasFaded) return;
        setHasFaded(true);
        setIsVisible(false);
        setTimeout(() => {
            setIsMounted(false);
        }, 1100); // Slightly more than transition
    }, [hasFaded]);

    useEffect(() => {
        // Minimum time we ALWAYS show the loader to avoid flashes on fast connections
        const minTimer = setTimeout(() => {
            // After min time, we check if video already ended or failed
            if (videoRef.current?.ended || videoRef.current?.error) {
                handleFadeOut();
            }
        }, 1000);

        const fallbackTimer = setTimeout(() => {
            handleFadeOut();
        }, durationMs);

        return () => {
            clearTimeout(minTimer);
            clearTimeout(fallbackTimer);
        };
    }, [durationMs, handleFadeOut]);

    useEffect(() => {
        // Attempt play, but don't force hide on failure (wait for safety timeout)
        if (videoRef.current) {
            videoRef.current.play().catch(() => {
                console.warn("Autoplay was blocked - waiting for safety timeout or interaction.");
            });
        }
    }, []);

    if (!isMounted) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] bg-black flex items-center justify-center transition-opacity duration-1000",
                isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
        >
            <video
                ref={videoRef}
                className="w-48 h-48 object-contain"
                autoPlay
                muted
                playsInline
                onEnded={handleFadeOut}
                onError={handleFadeOut}
            >
                <source src="/loading.mp4" type="video/mp4" />
                {/* Fallback for browsers that don't support video */}
                <div className="w-12 h-12 rounded-full border-4 border-[#8B5CF6] border-t-transparent animate-spin" />
            </video>
        </div>
    );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
    durationMs?: number; // Optional safety timeout duration
}

export function LoadingScreen({ durationMs = 8000 }: LoadingScreenProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [hasFaded, setHasFaded] = useState(false);
    const [shouldRender, setShouldRender] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFadeOut = React.useCallback(() => {
        setIsVisible((prev) => {
            if (!prev) return prev;
            setHasFaded(true);
            setTimeout(() => {
                setShouldRender(false);
            }, 1100);
            return false;
        });
    }, []);

    useEffect(() => {
        const minTimer = setTimeout(() => {
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
        if (videoRef.current) {
            videoRef.current.play().catch(() => {
                console.warn("Autoplay was blocked - waiting for safety timeout.");
            });
        }
    }, []);

    if (!shouldRender) return null;

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

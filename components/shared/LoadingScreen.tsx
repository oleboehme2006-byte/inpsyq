'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
    durationMs?: number; // Optional safety timeout duration
}

export function LoadingScreen({ durationMs = 8000 }: LoadingScreenProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Final unmount sequence
    const triggerFadeOut = () => {
        setIsVisible(false);
        console.log("LoadingScreen: Fading out...");
        setTimeout(() => {
            setShouldRender(false);
            console.log("LoadingScreen: Unmounting.");
        }, 1100);
    };

    useEffect(() => {
        console.log("LoadingScreen: Mounted and visible.");

        // Block scrolling
        document.body.style.overflow = 'hidden';

        // Check if video is already broken/ended after 1s
        const checkTimer = setTimeout(() => {
            if (videoRef.current) {
                if (videoRef.current.ended) {
                    console.log("LoadingScreen: Video already ended, triggering fade.");
                    triggerFadeOut();
                } else if (videoRef.current.error) {
                    console.error("LoadingScreen: Video error detected:", videoRef.current.error);
                    triggerFadeOut();
                }
            }
        }, 1500);

        // Fail-safe
        const failSafeTimer = setTimeout(() => {
            console.log("LoadingScreen: Fail-safe triggered.");
            triggerFadeOut();
        }, durationMs);

        return () => {
            clearTimeout(checkTimer);
            clearTimeout(failSafeTimer);
            document.body.style.overflow = '';
        };
    }, [durationMs]);

    useEffect(() => {
        if (videoRef.current) {
            console.log("LoadingScreen: Attempting video play...");
            videoRef.current.play().catch(err => {
                console.warn("LoadingScreen: Autoplay blocked/failed. Waiting for fallback.", err);
            });
        }
    }, []);

    if (!shouldRender) return null;

    return (
        <div
            id="loading-screen-overlay"
            className={cn(
                "fixed inset-0 z-[9999] bg-[#000000] flex items-center justify-center transition-opacity duration-1000",
                isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
        >
            <video
                ref={videoRef}
                className="w-48 h-48 object-contain"
                muted
                playsInline
                onEnded={triggerFadeOut}
                onError={(e) => {
                    console.error("LoadingScreen: Video on error event fired.");
                    triggerFadeOut();
                }}
            >
                <source src="/loading.mp4" type="video/mp4" />
                <div className="w-12 h-12 rounded-full border-4 border-[#8B5CF6] border-t-transparent animate-spin" />
            </video>
        </div>
    );
}

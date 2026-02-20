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
        setTimeout(() => {
            setShouldRender(false);
        }, 1100);
    };

    useEffect(() => {
        // Block scrolling
        document.body.style.overflow = 'hidden';

        // SAFETY: Only allow fading out after at least 2 seconds
        // to ensure the user actually SEES the animation start.
        const minVisibleTimer = setTimeout(() => {
            if (videoRef.current?.ended) {
                triggerFadeOut();
            }
        }, 2000);

        // Fail-safe
        const failSafeTimer = setTimeout(() => {
            triggerFadeOut();
        }, durationMs);

        return () => {
            clearTimeout(minVisibleTimer);
            clearTimeout(failSafeTimer);
            document.body.style.overflow = '';
        };
    }, [durationMs]);

    useEffect(() => {
        if (videoRef.current) {
            // Force play
            videoRef.current.play().catch(() => {
                console.warn("Autoplay blocked/failed. Waiting for fallback.");
            });
        }
    }, []);

    if (!shouldRender) return null;

    return (
        <div
            id="loading-screen-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
                backgroundColor: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 1000ms ease-in-out',
                pointerEvents: isVisible ? 'all' : 'none',
            }}
        >
            <video
                ref={videoRef}
                style={{ width: '12rem', height: '12rem', objectFit: 'contain' }}
                muted
                playsInline
                onEnded={triggerFadeOut}
            >
                <source src="/loading.mp4" type="video/mp4" />
                <div
                    style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '50%',
                        border: '4px solid #8B5CF6',
                        borderTopColor: 'transparent',
                        animation: 'spin 1s linear infinite'
                    }}
                />
            </video>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin { to { transform: rotate(360deg); } }
                body { overflow: hidden !important; }
            `}} />
        </div>
    );
}

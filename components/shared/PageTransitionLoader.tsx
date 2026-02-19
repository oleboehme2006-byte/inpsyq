'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export function PageTransitionLoader() {
    const pathname = usePathname();

    const [isAnimating, setIsAnimating] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Same handler for when video finishes normally or fallback triggers
    const triggerFadeOut = () => {
        setIsFadingOut(true);
        setTimeout(() => {
            setIsAnimating(false);
            setIsFadingOut(false);
        }, 500);
    };

    // Whenever the route changes, restart the animation
    useEffect(() => {
        setIsAnimating(true);
        setIsFadingOut(false);

        let fallbackTimeout: NodeJS.Timeout;

        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().then(() => {
                // Keep a slightly longer fallback (3 seconds max) just to be absolutely safe (since video is 2s)
                fallbackTimeout = setTimeout(() => {
                    triggerFadeOut();
                }, 3000);
            }).catch(() => {
                // Autoplay blocked or something went wrong
                triggerFadeOut();
            });
        } else {
            fallbackTimeout = setTimeout(() => {
                triggerFadeOut();
            }, 3000);
        }

        return () => clearTimeout(fallbackTimeout);
    }, [pathname]);

    const isHidden = !isAnimating && !isFadingOut;

    return (
        <div
            className={`fixed inset-0 z-[10000] bg-[#000000] flex items-center justify-center transition-opacity duration-500 ease-in-out ${isHidden ? 'hidden' : isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                }`}
        >
            <video
                ref={videoRef}
                src="/loading.mov"
                autoPlay
                muted
                playsInline
                onEnded={triggerFadeOut}
                onError={triggerFadeOut}
                className="w-48 h-48 object-contain"
            />
        </div>
    );
}

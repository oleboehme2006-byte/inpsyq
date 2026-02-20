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

    // Whenever the route completes changing, or on initial load
    useEffect(() => {
        setIsAnimating(true);
        setIsFadingOut(false);

        let fallbackTimeout: NodeJS.Timeout;

        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().then(() => {
                fallbackTimeout = setTimeout(() => {
                    triggerFadeOut();
                }, 3000);
            }).catch(() => {
                triggerFadeOut();
            });
        } else {
            fallbackTimeout = setTimeout(() => {
                triggerFadeOut();
            }, 3000);
        }

        return () => clearTimeout(fallbackTimeout);
    }, [pathname]);

    // Intercept clicks on Next.js Links to trigger loading instantly 
    // before the network request for the new page even begins
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Find the closest anchor tag
            const anchor = target.closest('a');

            if (!anchor) return;

            const href = anchor.getAttribute('href');
            // If it's a valid internal link and not the current page
            if (href && href.startsWith('/') && href !== pathname) {
                setIsAnimating(true);
                setIsFadingOut(false);
                if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play().catch(() => { });
                }
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [pathname]);

    const isHidden = !isAnimating && !isFadingOut;

    return (
        <div
            className={`fixed inset-0 z-[10000] bg-[#000000] flex items-center justify-center transition-opacity duration-500 ease-in-out ${isHidden ? 'hidden' : isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                }`}
        >
            <video
                ref={videoRef}
                src="/loading.MP4"
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={triggerFadeOut}
                onError={triggerFadeOut}
                className="w-32 h-32 object-contain"
            />
        </div>
    );
}

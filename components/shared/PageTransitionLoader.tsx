'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export function PageTransitionLoader() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Start true for initial page load
    const [isAnimating, setIsAnimating] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);

    // Ref to track if we are currently navigating
    const isNavigatingRef = useRef(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const triggerFadeOut = () => {
        setIsFadingOut(true);
        setTimeout(() => {
            setIsAnimating(false);
            setIsFadingOut(false);
        }, 500);
    };

    // 1. Initial Load handling (only runs once on mount)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isNavigatingRef.current) {
                triggerFadeOut();
            }
        }, 2000); // 2 seconds minimum for initial load

        return () => clearTimeout(timer);
    }, []);

    // 2. Next.js Route changes (Navigation Finished)
    useEffect(() => {
        // If we were navigating, and the pathname changed, we have arrived!
        if (isNavigatingRef.current) {
            isNavigatingRef.current = false;
            // Add a tiny delay to allow the new page component to mount before lifting the veil
            const timer = setTimeout(() => {
                triggerFadeOut();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [pathname, searchParams]);

    // 3. Intercept Clicks (Navigation Started)
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Find the closest anchor tag
            const anchor = target.closest('a');

            if (!anchor) return;

            const href = anchor.getAttribute('href');
            // If it's a valid internal link and not the current page
            if (href && href.startsWith('/') && href !== pathname) {
                isNavigatingRef.current = true;

                setIsAnimating(true);
                setIsFadingOut(false);

                if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play().catch(() => { });
                }
            }
        };

        // Use capture phase to ensure we catch it before Next.js Link overrides
        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [pathname]);

    const isHidden = !isAnimating && !isFadingOut;

    return (
        <div
            className={`fixed inset-0 z-[10000] bg-[#000000] flex items-center justify-center transition-opacity duration-500 ease-in-out ${isHidden ? 'hidden' : isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
        >
            <video
                ref={videoRef}
                src="/loading.MP4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="w-32 h-32 object-contain"
            />
        </div>
    );
}

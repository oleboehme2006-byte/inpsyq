'use client';

import React, { useEffect, useState } from 'react';

/**
 * LoadingScreen - A full-screen overlay that plays a 2-second video and fades out.
 * 
 * Used primarily on the public landing page to create a dramatic entrance.
 * Ensures fast load by using a highly optimized, muted inline video.
 */
export function LoadingScreen() {
    const [isVisible, setIsVisible] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        // The provided video is exactly 2 seconds long.
        // We start the fade-out slightly before the end to ensure a smooth transition
        // without the video pausing on the last frame abruptly.
        const fadeTimer = setTimeout(() => {
            setIsFadingOut(true);
        }, 1800); // Start fading out at 1.8 seconds

        // Remove the component from the DOM completely after the fade out completes (e.g. 500ms transition)
        const unmountTimer = setTimeout(() => {
            setIsVisible(false);
        }, 2300);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(unmountTimer);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] bg-black flex items-center justify-center transition-opacity duration-500 ease-in-out pointer-events-none ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
        >
            <video
                src="/loading.mp4"
                autoPlay
                muted
                playsInline
                disablePictureInPicture
                className="w-[150px] object-contain"
            />
        </div>
    );
}

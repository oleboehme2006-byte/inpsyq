import { useState, useEffect } from 'react';

export function useTutorialScroll(totalStages: number = 4) {
    const [progress, setProgress] = useState(0); // 0 to 1

    useEffect(() => {
        let currentProgress = 0;
        // Total "scroll distance" to reach 100%. Adjust for desired speed.
        const TARGET_DELTA_MAX = totalStages * 1000;

        const handleWheel = (e: WheelEvent) => {
            // Prevent native scrolling
            e.preventDefault();

            currentProgress += e.deltaY / TARGET_DELTA_MAX;
            currentProgress = Math.max(0, Math.min(1, currentProgress));
            setProgress(currentProgress);
        };

        // Touch support
        let touchStartY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const delta = touchStartY - e.touches[0].clientY;
            touchStartY = e.touches[0].clientY;
            currentProgress += delta / TARGET_DELTA_MAX;
            currentProgress = Math.max(0, Math.min(1, currentProgress));
            setProgress(currentProgress);
        };

        // Needs to be non-passive to call preventDefault
        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [totalStages]);

    return { progress };
}

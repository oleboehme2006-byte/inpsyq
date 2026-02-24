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

            // Calculate delta
            const deltaY = e.deltaY;

            // Update progress
            currentProgress += deltaY / TARGET_DELTA_MAX;

            // Clamp between 0 and 1
            currentProgress = Math.max(0, Math.min(1, currentProgress));

            setProgress(currentProgress);
        };

        // Needs to be non-passive to call preventDefault
        window.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, [totalStages]);

    return { progress };
}

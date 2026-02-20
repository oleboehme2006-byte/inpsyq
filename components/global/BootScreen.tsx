'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function BootScreen() {
    const [isVisible, setIsVisible] = useState(true);

    // Prevent hydration mismatch by only rendering after mount
    useEffect(() => {
        // Safety fallback: if video fails to load or play, auto-hide after 5 seconds
        const safetyTimeout = setTimeout(() => {
            setIsVisible(false);
        }, 5000);

        return () => clearTimeout(safetyTimeout);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
                >
                    <div className="w-full max-w-[200px] aspect-square flex items-center justify-center">
                        <video
                            src="/loading.mp4"
                            autoPlay
                            muted
                            playsInline
                            onEnded={() => setIsVisible(false)}
                            className="w-full h-full object-contain pointer-events-none"
                            // Force hardware acceleration and prevent iOS full screen
                            style={{
                                WebkitTransform: 'translate3d(0, 0, 0)',
                                transform: 'translate3d(0, 0, 0)'
                            }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

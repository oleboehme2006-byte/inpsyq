"use client";

import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "./BrandLogo";
import { useEffect, useState } from "react";

export default function PageLoader() {
    const [isLoading, setIsLoading] = useState(true);

    // We rely on the logo's internal animation callback to finish loading
    const handleAnimationComplete = () => {
        // Small delay after underline finishes before fading out opacity
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    };

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    key="loader"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050509]"
                >
                    <div className="relative">
                        <BrandLogo className="text-5xl text-white" animated={true} onAnimationComplete={handleAnimationComplete} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

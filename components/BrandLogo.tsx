"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

interface BrandLogoProps {
    className?: string; // Text color/size
    animated?: boolean; // If true, plays the blue loading animation
    onAnimationComplete?: () => void;
}

export default function BrandLogo({ className, animated = false, onAnimationComplete }: BrandLogoProps) {
    return (
        <div className={clsx("inline-flex flex-col leading-none", className)} aria-label="InPsyq">
            {/* Text Layer */}
            <span className="font-semibold tracking-tight">
                InPsyq
            </span>

            {/* Underline Layer */}
            {/* Positioned relative to text: top-full with negative margin to pulling it up to baseline/descender crossing */}
            {animated ? (
                <motion.div
                    initial={{ width: 0, backgroundColor: "#6366F1" }} // Brand Blue
                    animate={{ width: "100%", backgroundColor: "#ffffff" }} // Explicit white to match text in loader
                    transition={{
                        width: { duration: 1.5, ease: "easeInOut" },
                        backgroundColor: { delay: 1.4, duration: 0.3 }
                    }}
                    onAnimationComplete={onAnimationComplete}
                    className="h-[3px] mt-[0.15em]"
                />
            ) : (
                <div className="h-[3px] w-full bg-current mt-[0.15em]" />
            )}
        </div>
    );
}

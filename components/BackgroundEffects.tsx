"use client";

import { motion } from "framer-motion";

export default function BackgroundEffects() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Deep gradient blob top-left */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] bg-accent-primary/20 rounded-full blur-[120px] mix-blend-screen"
            />

            {/* Cyan gradient blob bottom-right */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                }}
                className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] bg-accent-secondary/10 rounded-full blur-[100px] mix-blend-screen"
            />

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none z-[-1]" />
        </div>
    );
}

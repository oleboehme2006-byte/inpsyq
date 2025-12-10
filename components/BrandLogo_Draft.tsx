"use client";

import clsx from "clsx";

interface BrandLogoProps {
    className?: string; // Font size/colors
    underlineClass?: string; // For animation override
}

export default function BrandLogo({ className = "", underlineClass = "" }: BrandLogoProps) {
    // We use a clean DOM structure that allows the loader to animate the underline width.
    // The 'q' tail and stem are constructed via CSS.

    return (
        <div className={clsx("relative inline-flex items-baseline font-bold tracking-tight select-none", className)}>
            <span className="relative z-10">InPsy</span>
            <span className="relative z-10 ml-[1px]">q</span>

            {/* The Underline Structure */}
            {/* Container position: starts below InPsy, goes right to q, turns up */}
            <div className={clsx("absolute bottom-[0.1em] left-0 h-[0.1em] bg-current pointer-events-none", underlineClass)}>
                {/* This div represents the main horizontal line. 
             If animated, its width will grow. 
             Ideally the loader passes a specific class or style.
             By default in static mode, it should be full width up to the q stem?
             Actually, for the static logo, let's just make it look right.
          */}
            </div>
        </div>
    );
}

// NOTE: The request requires a very specific shape: 
// "Line continues to the position under the q and becomes the vertical stem of the q"
// This is hard to do with just standard text 'q'. 
// We should hide the real 'q' and draw a custom one, OR mask it.
// Let's try a custom SVG approach for the Logo to ensure perfect control.

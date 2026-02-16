import React from 'react';
import { cn } from '@/lib/utils';

interface InPsyqLogoProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeMap = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
};

const barMap = {
    sm: 'h-0.5',
    md: 'h-1',
    lg: 'h-1.5',
};

export function InPsyqLogo({ size = 'md', className }: InPsyqLogoProps) {
    return (
        <div className={cn("relative inline-block", className)}>
            <span className={cn("font-display font-semibold text-white tracking-tight", sizeMap[size])}>
                inPsyq
            </span>
            <div className={cn(
                "absolute -bottom-1 left-0 w-full rounded-full bg-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.5)]",
                barMap[size]
            )} />
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface Slide {
    icon: React.ReactNode;
    headline: string;
    body: string;
    bullets?: string[];
}

interface SlideShowProps {
    slides: Slide[];
    onComplete: () => void;
}

export function SlideShow({ slides, onComplete }: SlideShowProps) {
    const [current, setCurrent] = useState(0);

    const slide = slides[current];
    const isFirst = current === 0;
    const isLast = current === slides.length - 1;

    const goNext = () => {
        if (isLast) {
            onComplete();
        } else {
            setCurrent(c => c + 1);
        }
    };

    const goBack = () => {
        if (!isFirst) setCurrent(c => c - 1);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 shrink-0">
                <span className="text-xs font-mono text-text-tertiary tracking-widest">
                    {current + 1} / {slides.length}
                </span>
                {/* Progress bar */}
                <div className="flex-1 mx-8 h-[2px] bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#8B5CF6] rounded-full transition-all duration-300"
                        style={{ width: `${((current + 1) / slides.length) * 100}%` }}
                    />
                </div>
                <button
                    onClick={onComplete}
                    className="text-text-tertiary hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/5"
                    aria-label="Skip"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Slide content */}
            <div className="flex-1 flex items-center justify-center px-8 py-12">
                <div
                    key={current}
                    className="max-w-xl w-full text-center"
                    style={{
                        animation: 'fadeSlideIn 0.3s ease forwards',
                    }}
                >
                    {/* Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6]">
                            {slide.icon}
                        </div>
                    </div>

                    {/* Headline */}
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-6 leading-tight">
                        {slide.headline}
                    </h2>

                    {/* Body */}
                    <p className="text-text-secondary leading-relaxed mb-6">
                        {slide.body}
                    </p>

                    {/* Optional bullets */}
                    {slide.bullets && slide.bullets.length > 0 && (
                        <ul className="text-left space-y-2 max-w-md mx-auto">
                            {slide.bullets.map((b, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shrink-0" />
                                    {b}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Bottom navigation */}
            <div className="flex items-center justify-between px-8 py-6 border-t border-white/5 shrink-0">
                <button
                    onClick={goBack}
                    disabled={isFirst}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/8 text-sm font-medium text-text-secondary hover:text-white hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                    onClick={onComplete}
                    className="text-xs font-mono text-text-tertiary hover:text-white transition-colors"
                >
                    Skip
                </button>
                <button
                    onClick={goNext}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#8B5CF6] text-white text-sm font-medium hover:bg-[#7C3AED] transition-colors"
                >
                    {isLast ? 'Finish' : 'Next'} {!isLast && <ChevronRight className="w-4 h-4" />}
                </button>
            </div>

            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

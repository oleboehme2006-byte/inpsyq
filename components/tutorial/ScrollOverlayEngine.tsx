'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTutorialScroll } from '@/hooks/useTutorialScroll';
import { createTimeline, set } from 'animejs';

export interface TutorialStep {
    title: string;
    content: string;
    targetSelector: string;
    canvasTranslateY?: number;
}

interface Props {
    children: React.ReactNode;
    steps: TutorialStep[];
}

export function ScrollOverlayEngine({ children, steps }: Props) {
    const { progress } = useTutorialScroll(steps.length);
    const canvasRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<any>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Calculate current step based on progress aggressively to avoid lag
    useEffect(() => {
        const index = Math.min(steps.length - 1, Math.floor(progress * steps.length));
        setCurrentStepIndex(index);
    }, [progress, steps.length]);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Initialize Anime.js timeline to handle background Canvas scrolling
        const tl = createTimeline({
            autoplay: false,
        });

        const stepDuration = 10000 / Math.max(1, steps.length - 1);

        steps.forEach((step, index) => {
            if (index === 0) {
                if (canvasRef.current) {
                    set(canvasRef.current, { translateY: step.canvasTranslateY || 0 });
                }
            } else {
                if (canvasRef.current) {
                    tl.add(canvasRef.current, {
                        translateY: step.canvasTranslateY || 0,
                        duration: stepDuration,
                        ease: 'inOutSine'
                    }, (index - 1) * stepDuration);
                }
            }
        });

        timelineRef.current = tl;

        return () => {
            if (timelineRef.current) timelineRef.current.pause();
        };
    }, [steps]);

    useEffect(() => {
        if (timelineRef.current) {
            timelineRef.current.seek(timelineRef.current.duration * progress);
        }
    }, [progress]);

    const currentStep = steps[currentStepIndex] || steps[0];

    return (
        <div className="relative w-full h-full flex items-center overflow-hidden">
            {/* The Canvas (Dashboard Replica) */}
            <div className="absolute inset-0 w-full h-full flex justify-end">
                {/* Push canvas to right so panel has room, or overlay it. We will overlay to match plan exactly */}
                <div
                    ref={canvasRef}
                    className="w-full absolute top-0 left-0 transition-transform will-change-transform"
                    style={{ transformOrigin: 'top center' }}
                >
                    <div className="relative isolate w-full">
                        {children}
                        {/* Overlay Dimmer - Must sit above the children but below the elevated target */}
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Explanation Panel - Floating on top */}
            <div className="relative z-50 w-full max-w-7xl mx-auto px-12 pointer-events-none">
                <div className="w-[450px] bg-[#0A0A0A]/90 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-500 ease-out transform pointer-events-auto">

                    {/* Progress Indicator Dots */}
                    <div className="flex gap-2 mb-8">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStepIndex ? 'w-8 bg-[#8B5CF6]' : 'w-2 bg-white/20'}`}
                            />
                        ))}
                    </div>

                    <div className="text-xs font-mono text-[#8B5CF6] mb-3 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
                        Stage {currentStepIndex + 1}
                    </div>

                    <h3 className="text-3xl font-display font-bold text-white mb-6 leading-tight">
                        {currentStep.title}
                    </h3>

                    <p className="text-lg text-text-secondary leading-relaxed mb-8">
                        {currentStep.content}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-text-tertiary font-mono pt-6 border-t border-white/5">
                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1 group">↑ <span className="opacity-0 group-hover:opacity-100 transition-opacity">Reverse</span></span>
                            <span className="flex items-center gap-1">↓ Scroll to advance</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global style to elevate the active target component above the dimmer mask */}
            <style>{`
                ${currentStep.targetSelector} {
                    position: relative !important;
                    z-index: 50 !important;
                    box-shadow: 0 0 40px rgba(139, 92, 246, 0.15) !important;
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 0.75rem !important;
                    background-color: #050505 !important; /* Ensure visibility against blur */
                    pointer-events: none !important; /* Prevent accidental clicks inside tutorial */
                }
            `}</style>
        </div>
    );
}

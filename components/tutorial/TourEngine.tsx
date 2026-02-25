'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface TourStep {
    title: string;
    content: string;
    targetSelector?: string; // if absent: popover centers on screen, no spotlight
}

interface PopoverPos {
    top: number;
    left: number;
}

interface SpotlightRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

interface TourEngineProps {
    steps: TourStep[];
    onComplete: () => void;
}

const POPOVER_W = 360;
const POPOVER_H = 260; // estimated max height for positioning math
const PAD = 16; // gap between spotlight and popover
const SPOTLIGHT_PAD = 6; // extra padding around target element

export function TourEngine({ steps, onComplete }: TourEngineProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
    const [popoverPos, setPopoverPos] = useState<PopoverPos>({ top: 0, left: 0 });
    const [visible, setVisible] = useState(false);
    const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const step = steps[currentStep];

    const computePositions = useCallback(() => {
        if (!step?.targetSelector) {
            // No target — center popover on screen, no spotlight
            setSpotlight(null);
            setPopoverPos({
                top: Math.max(16, (window.innerHeight - POPOVER_H) / 2),
                left: Math.max(16, (window.innerWidth - POPOVER_W) / 2),
            });
            setVisible(true);
            return;
        }

        const el = document.querySelector(step.targetSelector);
        if (!el) {
            setSpotlight(null);
            setPopoverPos({
                top: Math.max(16, (window.innerHeight - POPOVER_H) / 2),
                left: Math.max(16, (window.innerWidth - POPOVER_W) / 2),
            });
            setVisible(true);
            return;
        }

        const rect = el.getBoundingClientRect();
        const sRect: SpotlightRect = {
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + SPOTLIGHT_PAD * 2,
            height: rect.height + SPOTLIGHT_PAD * 2,
        };
        setSpotlight(sRect);

        // Smart positioning: try right → bottom → left → top
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let pos: PopoverPos;

        if (rect.right + PAD + POPOVER_W + 16 <= vw) {
            // Right
            pos = {
                top: Math.max(16, Math.min(rect.top, vh - POPOVER_H - 16)),
                left: rect.right + PAD,
            };
        } else if (rect.bottom + PAD + POPOVER_H + 16 <= vh) {
            // Bottom
            pos = {
                top: rect.bottom + PAD,
                left: Math.max(16, Math.min(rect.left, vw - POPOVER_W - 16)),
            };
        } else if (rect.left - PAD - POPOVER_W - 16 >= 0) {
            // Left
            pos = {
                top: Math.max(16, Math.min(rect.top, vh - POPOVER_H - 16)),
                left: rect.left - PAD - POPOVER_W,
            };
        } else {
            // Top
            pos = {
                top: Math.max(16, rect.top - PAD - POPOVER_H),
                left: Math.max(16, Math.min(rect.left, vw - POPOVER_W - 16)),
            };
        }

        setPopoverPos(pos);
        setVisible(true);
    }, [step]);

    useEffect(() => {
        setVisible(false);
        if (settleTimer.current) clearTimeout(settleTimer.current);

        if (step?.targetSelector) {
            const el = document.querySelector(step.targetSelector);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        settleTimer.current = setTimeout(computePositions, 350);

        return () => {
            if (settleTimer.current) clearTimeout(settleTimer.current);
        };
    }, [currentStep, computePositions, step]);

    const goNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            onComplete();
        }
    };

    const goBack = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    const isFirst = currentStep === 0;
    const isLast = currentStep === steps.length - 1;

    return (
        <>
            {/* Overlay backdrop — blocks pointer events except popover */}
            <div className="fixed inset-0 z-[9998] pointer-events-none">
                {spotlight ? (
                    /* Spotlight cutout via box-shadow */
                    <div
                        style={{
                            position: 'fixed',
                            top: spotlight.top,
                            left: spotlight.left,
                            width: spotlight.width,
                            height: spotlight.height,
                            boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
                            borderRadius: '6px',
                            pointerEvents: 'none',
                            transition: 'all 0.3s ease',
                        }}
                    />
                ) : (
                    /* Full dim — no spotlight */
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.72)',
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </div>

            {/* Popover card */}
            <div
                className="fixed z-[9999] pointer-events-auto"
                style={{
                    top: popoverPos.top,
                    left: popoverPos.left,
                    width: POPOVER_W,
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.25s ease, transform 0.25s ease',
                }}
            >
                <div className="rounded-2xl bg-[#0A0A0A] border border-white/12 shadow-2xl overflow-hidden">
                    {/* Header bar */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-0">
                        <span className="text-[11px] font-mono text-text-tertiary tracking-widest">
                            {currentStep + 1} / {steps.length}
                        </span>
                        <button
                            onClick={onComplete}
                            className="text-text-tertiary hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
                            aria-label="Skip tour"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-5 py-4">
                        <h3 className="text-sm font-display font-semibold text-white mb-2 leading-tight">
                            {step.title}
                        </h3>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            {step.content}
                        </p>
                    </div>

                    {/* Progress bar */}
                    <div className="mx-5 mb-3 h-[2px] bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#8B5CF6] rounded-full transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>

                    {/* Footer buttons */}
                    <div className="flex items-center justify-between px-5 pb-4">
                        <button
                            onClick={goBack}
                            disabled={isFirst}
                            className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" /> Back
                        </button>
                        <button
                            onClick={onComplete}
                            className="text-xs font-mono text-text-tertiary hover:text-white transition-colors"
                        >
                            Skip
                        </button>
                        <button
                            onClick={goNext}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#8B5CF6] text-white text-xs font-medium hover:bg-[#7C3AED] transition-colors"
                        >
                            {isLast ? 'Finish' : 'Next'} {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

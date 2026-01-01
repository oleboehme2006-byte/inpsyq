'use client';

/**
 * OnboardingHint Component
 * 
 * Displays a dismissible contextual hint.
 * Uses existing design system - no new colors or layout patterns.
 * Renders inline with stable spacing (no layout shift).
 */

import { useEffect, useState } from 'react';
import { getDismissedHints, dismissHint, shouldShowHint, Hint } from '@/lib/onboarding/hints';

interface OnboardingHintProps {
    hint: Hint;
    title?: string;
    className?: string;
}

export function OnboardingHint({ hint, title, className = '' }: OnboardingHintProps) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setDismissed(getDismissedHints());
    }, []);

    // SSR-safe: don't render until mounted
    if (!mounted) return null;

    // Check if should show
    if (!shouldShowHint(hint, dismissed)) return null;

    const handleDismiss = () => {
        dismissHint(hint.id);
        setDismissed(prev => new Set([...Array.from(prev), hint.id]));
    };

    return (
        <div
            className={`
                flex items-start gap-3 p-3
                bg-neutral-50 dark:bg-neutral-900
                border border-neutral-200 dark:border-neutral-700
                rounded-lg text-sm
                ${className}
            `}
            role="note"
            aria-label="Onboarding hint"
        >
            <span className="text-neutral-500 flex-shrink-0">ℹ️</span>
            <div className="flex-1 min-w-0">
                {title && (
                    <div className="font-medium text-neutral-700 dark:text-neutral-300 mb-0.5">
                        {title}
                    </div>
                )}
                <div className="text-neutral-600 dark:text-neutral-400">
                    {hint.content}
                </div>
            </div>
            {hint.dismissible && (
                <button
                    onClick={handleDismiss}
                    className="
                        text-neutral-400 hover:text-neutral-600
                        dark:text-neutral-500 dark:hover:text-neutral-300
                        text-xs flex-shrink-0
                    "
                    aria-label="Dismiss hint"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

/**
 * DemoBadge Component
 * 
 * Subtle indicator shown in demo mode.
 * Dismissible and persisted.
 */
interface DemoBadgeProps {
    className?: string;
}

const DEMO_BADGE_HINT_ID = 'demo-badge';

export function DemoBadge({ className = '' }: DemoBadgeProps) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setDismissed(getDismissedHints());
    }, []);

    if (!mounted) return null;

    if (dismissed.has(DEMO_BADGE_HINT_ID)) return null;

    const handleDismiss = () => {
        dismissHint(DEMO_BADGE_HINT_ID);
        setDismissed(prev => new Set([...Array.from(prev), DEMO_BADGE_HINT_ID]));
    };

    return (
        <div
            className={`
                inline-flex items-center gap-2 px-3 py-1.5
                bg-blue-50 dark:bg-blue-950
                border border-blue-200 dark:border-blue-800
                rounded-full text-xs
                text-blue-700 dark:text-blue-300
                ${className}
            `}
        >
            <span>Demo Mode</span>
            <span className="text-blue-400 dark:text-blue-500">—</span>
            <span className="text-blue-600 dark:text-blue-400">Contextual hints enabled</span>
            <button
                onClick={handleDismiss}
                className="
                    text-blue-400 hover:text-blue-600
                    dark:text-blue-500 dark:hover:text-blue-300
                    ml-1
                "
                aria-label="Dismiss demo badge"
            >
                ✕
            </button>
        </div>
    );
}

/**
 * Hook to get limited hints (max 2 on screen)
 */
export function useLimitedHints(hints: Array<Hint | null>, maxVisible: number = 2): Hint[] {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setDismissed(getDismissedHints());
    }, []);

    if (!mounted) return [];

    return hints
        .filter((h): h is Hint => h !== null && shouldShowHint(h, dismissed))
        .slice(0, maxVisible);
}

'use client';

/**
 * ExecutiveHintOverlay
 * 
 * Adds onboarding hints to the Executive Dashboard.
 * Renders as a non-invasive overlay that doesn't change layout.
 * Shows hints only when demo mode is active.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { OnboardingHint, DemoBadge, useLimitedHints } from '@/components/onboarding/OnboardingHint';
import { getDemoContext } from '@/lib/onboarding/demoMode';
import { EXECUTIVE_GUIDANCE, PROGRESSIVE_HINTS } from '@/lib/content/onboarding';
import { getContextualHint, Hint } from '@/lib/onboarding/hints';

interface ExecutiveHintOverlayProps {
    /** Current status from API (OK/DEGRADED/FAILED) */
    status?: 'OK' | 'DEGRADED' | 'FAILED';
    /** Primary driver source */
    primarySource?: 'INTERNAL' | 'EXTERNAL' | 'MIXED' | null;
    /** Whether watchlist has items */
    hasWatchlistItems?: boolean;
}

export function ExecutiveHintOverlay({
    status = 'OK',
    primarySource = null,
    hasWatchlistItems = false,
}: ExecutiveHintOverlayProps) {
    const searchParams = useSearchParams();
    const [showHints, setShowHints] = useState(false);
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        const demoFromQuery = searchParams?.get('demo') === 'true';
        const context = getDemoContext();
        setIsDemo(demoFromQuery || context.isDemo);
        setShowHints(demoFromQuery || context.showHints);
    }, [searchParams]);

    // Build hints list
    const purposeHint: Hint = {
        id: 'exec-purpose',
        content: EXECUTIVE_GUIDANCE.PURPOSE.description,
        dismissible: true,
    };

    const stateHint: Hint | null = status === 'OK'
        ? { id: 'exec-state-ok', content: EXECUTIVE_GUIDANCE.STATE_OK.description, dismissible: true }
        : status === 'DEGRADED'
            ? { id: 'exec-state-degraded', content: EXECUTIVE_GUIDANCE.STATE_DEGRADED.description, dismissible: true }
            : { id: 'exec-state-failed', content: EXECUTIVE_GUIDANCE.STATE_FAILED.description, dismissible: true };

    const pressureHint: Hint | null = primarySource === 'EXTERNAL'
        ? { id: 'exec-pressure-external', content: EXECUTIVE_GUIDANCE.PRESSURE_EXTERNAL.description, dismissible: true }
        : primarySource === 'MIXED'
            ? { id: 'exec-pressure-mixed', content: EXECUTIVE_GUIDANCE.PRESSURE_MIXED.description, dismissible: true }
            : null;

    // Limit to 2 visible hints
    const visibleHints = useLimitedHints([purposeHint, stateHint, pressureHint], 2);

    // Don't render if not in demo mode
    if (!showHints && !isDemo) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-none">
            <div className="max-w-xl mx-auto space-y-2 pointer-events-auto">
                {/* Demo badge at top */}
                {isDemo && (
                    <div className="flex justify-center mb-2">
                        <DemoBadge />
                    </div>
                )}

                {/* Hints stack */}
                {visibleHints.map((hint, i) => (
                    <OnboardingHint
                        key={hint.id}
                        hint={hint}
                        title={
                            hint.id === 'exec-purpose' ? EXECUTIVE_GUIDANCE.PURPOSE.title :
                                hint.id.includes('state') ? (status === 'OK' ? EXECUTIVE_GUIDANCE.STATE_OK.title :
                                    status === 'DEGRADED' ? EXECUTIVE_GUIDANCE.STATE_DEGRADED.title :
                                        EXECUTIVE_GUIDANCE.STATE_FAILED.title) :
                                    hint.id.includes('pressure') ? (primarySource === 'EXTERNAL' ? EXECUTIVE_GUIDANCE.PRESSURE_EXTERNAL.title :
                                        EXECUTIVE_GUIDANCE.PRESSURE_MIXED.title) :
                                        undefined
                        }
                    />
                ))}
            </div>
        </div>
    );
}

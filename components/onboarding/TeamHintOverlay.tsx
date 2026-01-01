'use client';

/**
 * TeamHintOverlay
 * 
 * Adds onboarding hints to the Team Dashboard.
 * Renders as a non-invasive overlay that doesn't change layout.
 * Shows hints only when demo mode is active.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { OnboardingHint, DemoBadge, useLimitedHints } from '@/components/onboarding/OnboardingHint';
import { getDemoContext } from '@/lib/onboarding/demoMode';
import { TEAM_GUIDANCE } from '@/lib/content/onboarding';
import { Hint } from '@/lib/onboarding/hints';

interface TeamHintOverlayProps {
    /** Current status from API (OK/DEGRADED/FAILED) */
    status?: 'OK' | 'DEGRADED' | 'FAILED';
    /** Primary driver source */
    driverSource?: 'INTERNAL' | 'EXTERNAL' | 'MIXED' | null;
    /** Whether actions are present */
    hasActions?: boolean;
}

export function TeamHintOverlay({
    status = 'OK',
    driverSource = null,
    hasActions = false,
}: TeamHintOverlayProps) {
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
        id: 'team-purpose',
        content: TEAM_GUIDANCE.STATE_CONTEXT.description,
        dismissible: true,
    };

    const driverHint: Hint | null = driverSource === 'EXTERNAL'
        ? { id: 'team-drivers-external', content: TEAM_GUIDANCE.DRIVERS_EXTERNAL.description, dismissible: true }
        : driverSource === 'INTERNAL'
            ? { id: 'team-drivers-internal', content: TEAM_GUIDANCE.DRIVERS_INTERNAL.description, dismissible: true }
            : null;

    const actionsHint: Hint | null = !hasActions
        ? { id: 'team-no-actions', content: TEAM_GUIDANCE.ACTIONS_ABSENT.description, dismissible: true }
        : { id: 'team-has-actions', content: TEAM_GUIDANCE.ACTIONS_PRESENT.description, dismissible: true };

    // Limit to 2 visible hints
    const visibleHints = useLimitedHints([purposeHint, actionsHint, driverHint], 2);

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
                {visibleHints.map((hint) => (
                    <OnboardingHint
                        key={hint.id}
                        hint={hint}
                        title={
                            hint.id === 'team-purpose' ? TEAM_GUIDANCE.STATE_CONTEXT.title :
                                hint.id === 'team-drivers-external' ? TEAM_GUIDANCE.DRIVERS_EXTERNAL.title :
                                    hint.id === 'team-drivers-internal' ? TEAM_GUIDANCE.DRIVERS_INTERNAL.title :
                                        hint.id === 'team-no-actions' ? TEAM_GUIDANCE.ACTIONS_ABSENT.title :
                                            hint.id === 'team-has-actions' ? TEAM_GUIDANCE.ACTIONS_PRESENT.title :
                                                undefined
                        }
                    />
                ))}
            </div>
        </div>
    );
}

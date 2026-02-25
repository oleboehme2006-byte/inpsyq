'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { TourEngine } from './TourEngine';
import { executiveSteps } from './TutorialExecutive';
import { teamleadSteps } from './TutorialTeamlead';
import type { Role } from '@/lib/access/roles';
import type { TourStep } from './TourEngine';

interface TutorialEntryPointProps {
    role: Role;
    isDemo?: boolean;
}

function roleToTrack(role: Role): 'executive' | 'teamlead' | 'admin' | 'employee' {
    if (role === 'EXECUTIVE') return 'executive';
    if (role === 'TEAMLEAD') return 'teamlead';
    if (role === 'EMPLOYEE') return 'employee';
    return 'admin';
}

function stepsForTrack(track: string): TourStep[] {
    if (track === 'executive') return executiveSteps;
    if (track === 'teamlead') return teamleadSteps;
    // Employee and Admin have SlideShow tours on the public /tutorial/{track} pages
    // — they do not run inline in the dashboard. Return empty to fall back to link.
    return [];
}

/**
 * TutorialEntryPoint
 *
 * "?" button always visible in the dashboard header area.
 *
 * Auth mode (isDemo=false):
 *   - On mount: fetches /api/user/tutorial-status; if track unseen → opens TourEngine inline.
 *   - "?" button opens TourEngine inline.
 *   - On complete/skip: PATCH /api/user/tutorial-status to mark seen.
 *
 * Demo mode (isDemo=true):
 *   - "?" button links to /tutorial/{track} public page.
 *   - No DB writes.
 */
export function TutorialEntryPoint({ role, isDemo = false }: TutorialEntryPointProps) {
    const track = roleToTrack(role);
    const steps = stepsForTrack(track);
    const hasInlineTour = steps.length > 0;

    const [tourOpen, setTourOpen] = useState(false);
    const hasChecked = useRef(false);

    useEffect(() => {
        if (isDemo || !hasInlineTour) return;
        if (hasChecked.current) return;
        hasChecked.current = true;

        fetch('/api/user/tutorial-status')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data?.seen) return;
                if (!data.seen[track]) {
                    setTourOpen(true);
                }
            })
            .catch(() => {
                // Never block the dashboard
            });
    }, [isDemo, hasInlineTour, track]);

    const handleComplete = () => {
        setTourOpen(false);
        if (!isDemo) {
            fetch('/api/user/tutorial-status', {
                method: 'PATCH',
                body: JSON.stringify({ track }),
                headers: { 'Content-Type': 'application/json' },
            }).catch(() => {});
        }
    };

    // Demo mode or no inline tour available → link to public tutorial page
    if (isDemo || !hasInlineTour) {
        return (
            <Link
                href={`/tutorial/${track}`}
                className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-[#0A0A0A]/90 border border-white/10 text-text-secondary hover:text-white hover:border-white/20 transition-all text-xs font-mono backdrop-blur-md shadow-lg"
                title="Open tutorial"
            >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>?</span>
            </Link>
        );
    }

    // Authenticated inline tour
    return (
        <>
            <button
                onClick={() => setTourOpen(true)}
                className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-[#0A0A0A]/90 border border-white/10 text-text-secondary hover:text-white hover:border-white/20 transition-all text-xs font-mono backdrop-blur-md shadow-lg"
                title="Open tutorial"
            >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>?</span>
            </button>

            {tourOpen && (
                <TourEngine steps={steps} onComplete={handleComplete} />
            )}
        </>
    );
}

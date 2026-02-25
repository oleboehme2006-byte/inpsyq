'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { ScrollOverlayEngine, TutorialStep } from './ScrollOverlayEngine';
import { TeamClientWrapper } from '@/components/dashboard/team/TeamClientWrapper';

const teamleadSteps: TutorialStep[] = [
    {
        title: 'The Team Context',
        content: 'The Teamlead view drills down into specific operational units. The color logic is strict: Red means immediate attention is required to prevent delivery failure.',
        targetSelector: '[data-tutorial="team-header"]',
        canvasTranslateY: 0,
    },
    {
        title: 'Causal Attribution',
        content: 'We identify the Why. Is the strain internal (e.g., lack of role clarity) or external (e.g., dependency bottlenecks)? This removes blame and focuses the team on structural solutions.',
        targetSelector: '[data-tutorial="team-drivers"]',
        canvasTranslateY: -400,
    },
    {
        title: 'Targeted Interventions',
        content: 'Stop guessing. The system provides highly targeted, psychologically-sound interventions based on the specific strain profile of this team this week.',
        targetSelector: '[data-tutorial="team-drivers"]',
        canvasTranslateY: -500,
    },
    {
        title: 'The Micro-Briefing',
        content: 'The weekly summary provides the Team Lead with the exact talking points needed for upcoming 1:1s or retro meetings, grounded in validated data.',
        targetSelector: '[data-tutorial="team-briefing"]',
        canvasTranslateY: -1000,
    },
];

export function TrackTeamlead() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/';

    const handleDismiss = () => {
        fetch('/api/user/tutorial-status', {
            method: 'PATCH',
            body: JSON.stringify({ track: 'teamlead' }),
            headers: { 'Content-Type': 'application/json' },
        }).catch(() => {});
        router.push(returnTo);
    };

    return (
        <ScrollOverlayEngine steps={teamleadSteps} onDismiss={handleDismiss}>
            <div className="w-full bg-[#050505] min-h-screen">
                {/* Pass null to force demo fallback (uses 'product' mock from teamDashboardData) */}
                <TeamClientWrapper teamId="product" initialData={null as any} />
            </div>
        </ScrollOverlayEngine>
    );
}

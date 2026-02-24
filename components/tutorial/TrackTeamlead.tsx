'use client';

import React from 'react';
import { ScrollOverlayEngine, TutorialStep } from './ScrollOverlayEngine';
import { TeamClientWrapper } from '@/components/dashboard/team/TeamClientWrapper';

const teamleadSteps: TutorialStep[] = [
    {
        title: "The Team Context",
        content: "The Teamlead view drills down into specific operational units. The color logic here is strict: Red means immediate attention is required to prevent delivery failure.",
        targetSelector: ".animate-in > div:nth-child(1)", // Header
        canvasTranslateY: 0
    },
    {
        title: "Causal Attribution",
        content: "We identify the Why. Is the strain internal (e.g., lack of role clarity) or external (e.g., dependency bottlenecks)? This removes blame and focuses the team on structural solutions.",
        targetSelector: ".animate-in > div:nth-child(4)", // DriversActionsSection
        canvasTranslateY: -400
    },
    {
        title: "Targeted Interventions",
        content: "Stop guessing. The system provides highly targeted, psychologically-sound interventions based on the specific strain profile of this team this week.",
        targetSelector: ".animate-in > div:nth-child(4)", // Keep same section
        canvasTranslateY: -500 // Scroll down slightly more
    },
    {
        title: "The Micro-Briefing",
        content: "The weekly summary provides the Team Lead with the exact talking points they need for their upcoming 1:1s or retro meetings, grounded in validated data.",
        targetSelector: ".animate-in > div:nth-child(5)", // Briefing
        canvasTranslateY: -1000
    }
];

export function TrackTeamlead() {
    return (
        <ScrollOverlayEngine steps={teamleadSteps}>
            <div className="w-full bg-[#050505] min-h-screen">
                {/* Provide null data to force demo fallback logic */}
                <TeamClientWrapper teamId="product" initialData={null as any} />
            </div>
        </ScrollOverlayEngine>
    );
}

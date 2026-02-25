'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ScrollOverlayEngine, TutorialStep } from './ScrollOverlayEngine';
import { AdminDemoShell } from './AdminDemoShell';

const adminSteps: TutorialStep[] = [
    {
        title: 'Onboarding an Organisation',
        content: 'Start by building your org roster. Invite executives, teamleads, and employees via email. Roles are assigned at invite time — each role unlocks a different dashboard view and level of data visibility.',
        targetSelector: '[data-tutorial="admin-roster"]',
        canvasTranslateY: 0,
    },
    {
        title: 'Running the Weekly Pipeline',
        content: 'Every Monday, the pipeline aggregates the previous week\'s responses, computes latent indices, and generates LLM narrative briefings for every team. You can trigger it manually here — use "Dry Run" to preview without writing to the DB.',
        targetSelector: '[data-tutorial="admin-pipeline"]',
        canvasTranslateY: -450,
    },
    {
        title: 'System Health at a Glance',
        content: 'This panel shows you whether the system ran cleanly. Stuck locks mean a pipeline run crashed mid-execution. Missing interpretations mean a team\'s LLM briefing failed to generate. Both can be resolved from here.',
        targetSelector: '[data-tutorial="admin-health"]',
        canvasTranslateY: -750,
    },
    {
        title: 'Data Governance',
        content: 'inPsyq enforces k-anonymity — a team\'s data is never surfaced unless at least k=4 members responded. Coverage and quality scores tell you whether the data you\'re acting on is statistically meaningful this week.',
        targetSelector: '[data-tutorial="admin-governance"]',
        canvasTranslateY: -1100,
    },
];

export function TrackAdmin() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/';

    const handleDismiss = () => {
        fetch('/api/user/tutorial-status', {
            method: 'PATCH',
            body: JSON.stringify({ track: 'admin' }),
            headers: { 'Content-Type': 'application/json' },
        }).catch(() => {});
        router.push(returnTo);
    };

    return (
        <ScrollOverlayEngine steps={adminSteps} onDismiss={handleDismiss}>
            <div className="w-full bg-bg-base min-h-screen">
                <AdminDemoShell />
            </div>
        </ScrollOverlayEngine>
    );
}

'use client';

import React from 'react';
import { ScrollOverlayEngine, TutorialStep } from './ScrollOverlayEngine';
import { ExecutiveClientWrapper } from '@/components/dashboard/executive/ExecutiveClientWrapper';
import type { ExecutiveDashboardData } from '@/services/dashboard/executiveReader';

const demoData: ExecutiveDashboardData = {
    orgName: 'Tutorial Org - Executive Setup',
    kpis: [],
    teams: [],
    drivers: [],
    watchlist: [],
    briefingParagraphs: [],
    governance: {
        coverage: 85,
        dataQuality: 78,
        totalSessions: 156,
        lastUpdated: 'Dec 15, 2025',
    },
};

const executiveSteps: TutorialStep[] = [
    {
        title: "The Enterprise Pulse",
        content: "Welcome to your command center. inPsyq aggregates weekly, anonymized data from across your entire organization to give you an instant, high-level read on your systemic health.",
        targetSelector: ".animate-in > div:nth-child(1)", // The Header
        canvasTranslateY: 0
    },
    {
        title: "The Latent Environment",
        content: "This is your organizational weather map. It visualizes the latent drivers of strain. We don't just show you 'Sentiment'—we map the exact psychological factors creating friction before they solidify into burnout.",
        targetSelector: ".animate-in > div:nth-child(3)", // EngagementIndexGraph container
        canvasTranslateY: -50
    },
    {
        title: "Leading Risk Indicators",
        content: "A high Withdrawal index is the direct precursor to quiet quitting and attrition. By catching this localized detachment early, you can intervene months before HR detects a retention problem.",
        targetSelector: ".animate-in > div:nth-child(2)", // KPI Row
        canvasTranslateY: 0
    },
    {
        title: "Narrative Synthesis",
        content: "You don't need a data science degree to interpret this. Our system acts as your digital psychologist, synthesizing the complex data into an actionable narrative briefing for your board.",
        targetSelector: ".animate-in > div:nth-child(6)", // Briefing block
        canvasTranslateY: -1000 // Scroll down significantly
    }
];

export function TrackExecutive() {
    return (
        <ScrollOverlayEngine steps={executiveSteps}>
            <div className="w-full bg-[#050505] min-h-screen">
                <ExecutiveClientWrapper initialData={demoData} />
            </div>
        </ScrollOverlayEngine>
    );
}

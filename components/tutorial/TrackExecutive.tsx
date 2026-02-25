'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { ScrollOverlayEngine, TutorialStep } from './ScrollOverlayEngine';
import { ExecutiveClientWrapper } from '@/components/dashboard/executive/ExecutiveClientWrapper';
import type { ExecutiveDashboardData } from '@/services/dashboard/executiveReader';

const demoData: ExecutiveDashboardData = {
    orgName: 'TechVentures GmbH',
    kpis: [
        { id: 'strain', title: 'Strain Index', value: '74', score: 0.74, semanticColor: 'strain', trendValue: '+3%', trend: 'up', description: 'Aggregate organizational strain across all teams.' },
        { id: 'withdrawal', title: 'Withdrawal Risk', value: '61', score: 0.61, semanticColor: 'withdrawal', trendValue: '-5%', trend: 'down', description: 'Likelihood of disengagement and attrition in the next 4 weeks.' },
        { id: 'trust', title: 'Trust Gap', value: '48', score: 0.48, semanticColor: 'trust-gap', trendValue: '+1%', trend: 'stable', description: 'Structural trust deficit between teams and leadership.' },
        { id: 'engagement', title: 'Engagement', value: '55', score: 0.55, semanticColor: 'engagement', trendValue: '+8%', trend: 'up', description: 'Active cognitive and emotional investment in work.' },
    ],
    series: [
        { date: 'Sep 2', fullDate: '2025-09-02T00:00:00Z', strain: 52, withdrawal: 38, trust: 33, engagement: 72, confidence: 4, strainRange: [48, 56], withdrawalRange: [34, 42], trustRange: [29, 37], engagementRange: [68, 76] },
        { date: 'Sep 9', fullDate: '2025-09-09T00:00:00Z', strain: 55, withdrawal: 41, trust: 35, engagement: 70, confidence: 4, strainRange: [51, 59], withdrawalRange: [37, 45], trustRange: [31, 39], engagementRange: [66, 74] },
        { date: 'Sep 16', fullDate: '2025-09-16T00:00:00Z', strain: 58, withdrawal: 44, trust: 37, engagement: 68, confidence: 3, strainRange: [55, 61], withdrawalRange: [41, 47], trustRange: [34, 40], engagementRange: [65, 71] },
        { date: 'Sep 23', fullDate: '2025-09-23T00:00:00Z', strain: 60, withdrawal: 47, trust: 39, engagement: 66, confidence: 3, strainRange: [57, 63], withdrawalRange: [44, 50], trustRange: [36, 42], engagementRange: [63, 69] },
        { date: 'Sep 30', fullDate: '2025-09-30T00:00:00Z', strain: 62, withdrawal: 50, trust: 41, engagement: 64, confidence: 4, strainRange: [58, 66], withdrawalRange: [46, 54], trustRange: [37, 45], engagementRange: [60, 68] },
        { date: 'Oct 7', fullDate: '2025-10-07T00:00:00Z', strain: 65, withdrawal: 52, trust: 43, engagement: 62, confidence: 4, strainRange: [61, 69], withdrawalRange: [48, 56], trustRange: [39, 47], engagementRange: [58, 66] },
        { date: 'Oct 14', fullDate: '2025-10-14T00:00:00Z', strain: 67, withdrawal: 54, trust: 44, engagement: 61, confidence: 3, strainRange: [64, 70], withdrawalRange: [51, 57], trustRange: [41, 47], engagementRange: [58, 64] },
        { date: 'Oct 21', fullDate: '2025-10-21T00:00:00Z', strain: 69, withdrawal: 56, trust: 45, engagement: 59, confidence: 3, strainRange: [66, 72], withdrawalRange: [53, 59], trustRange: [42, 48], engagementRange: [56, 62] },
        { date: 'Oct 28', fullDate: '2025-10-28T00:00:00Z', strain: 70, withdrawal: 57, trust: 46, engagement: 58, confidence: 4, strainRange: [66, 74], withdrawalRange: [53, 61], trustRange: [42, 50], engagementRange: [54, 62] },
        { date: 'Nov 4', fullDate: '2025-11-04T00:00:00Z', strain: 71, withdrawal: 59, trust: 47, engagement: 57, confidence: 4, strainRange: [67, 75], withdrawalRange: [55, 63], trustRange: [43, 51], engagementRange: [53, 61] },
        { date: 'Nov 11', fullDate: '2025-11-11T00:00:00Z', strain: 72, withdrawal: 60, trust: 47, engagement: 56, confidence: 3, strainRange: [69, 75], withdrawalRange: [57, 63], trustRange: [44, 50], engagementRange: [53, 59] },
        { date: 'Nov 18', fullDate: '2025-11-18T00:00:00Z', strain: 74, withdrawal: 61, trust: 48, engagement: 55, confidence: 3, strainRange: [71, 77], withdrawalRange: [58, 64], trustRange: [45, 51], engagementRange: [52, 58] },
    ],
    teams: [
        { teamId: 'team-platform', name: 'Platform', strain: 81, withdrawal: 72, trust: 55, engagement: 44, status: 'Critical', members: 8, coverage: 88 },
        { teamId: 'team-product', name: 'Product', strain: 62, withdrawal: 48, trust: 41, engagement: 63, status: 'At Risk', members: 6, coverage: 83 },
        { teamId: 'team-growth', name: 'Growth', strain: 45, withdrawal: 38, trust: 32, engagement: 72, status: 'Healthy', members: 5, coverage: 90 },
    ],
    drivers: [
        { id: 'd1', label: 'Role Clarity Deficit', score: 0.78, scope: 'Platform, Product', trend: 'up', details: { mechanism: 'Ambiguous responsibility boundaries generate decision paralysis under deadline pressure.', influence: 'High strain and withdrawal risk in Platform team.', recommendation: 'Facilitate a structured RACI review in the next leadership sync.' } },
        { id: 'd2', label: 'Cross-Team Trust Erosion', score: 0.61, scope: 'Platform, Growth', trend: 'stable', details: { mechanism: 'Inter-team dependency friction accumulates into distrust over multiple sprint cycles.', influence: 'Moderate trust gap and reduced cross-team knowledge sharing.', recommendation: 'Introduce a bi-weekly cross-team retrospective to surface blockers earlier.' } },
        { id: 'd3', label: 'Cognitive Overload Signal', score: 0.55, scope: 'Platform', trend: 'up', details: { mechanism: 'Sustained high cognitive load reduces executive function and increases error rate.', influence: 'Engagement decline and rising strain index.', recommendation: 'Audit Platform team\'s concurrent project load. Limit WIP to 3 initiatives per engineer.' } },
    ],
    watchlist: [],
    briefingParagraphs: [
        'Organizational strain reached 74 this week — a 3-point increase driven primarily by the Platform team. Withdrawal risk trends downward at 61, suggesting recent restructuring measures are beginning to stabilize attrition signals.',
        'The Trust Gap index at 48 remains the key structural risk factor. Engineering sub-teams report persistent inter-team dependency friction, particularly around cross-functional ownership of the data pipeline.',
        'Recommended executive action: prioritize role boundary clarification for the Platform team in the next leadership review. Engagement recovery in Growth (+8%) provides a positive contrast case to reference.',
    ],
    governance: {
        coverage: 87,
        dataQuality: 82,
        totalSessions: 214,
        lastUpdated: 'Nov 18, 2025',
    },
};

const executiveSteps: TutorialStep[] = [
    {
        title: 'The Enterprise Pulse',
        content: 'Welcome to your command center. inPsyq aggregates weekly, anonymized data from across your entire organization to give you an instant, high-level read on your systemic health.',
        targetSelector: '[data-tutorial="executive-header"]',
        canvasTranslateY: 0,
    },
    {
        title: 'The Latent Environment',
        content: 'This is your organizational weather map. It visualizes the latent drivers of strain. We don\'t just show you "Sentiment" — we map the exact psychological factors creating friction before they solidify into burnout.',
        targetSelector: '[data-tutorial="executive-chart"]',
        canvasTranslateY: -50,
    },
    {
        title: 'Leading Risk Indicators',
        content: 'A high Withdrawal index is the direct precursor to quiet quitting and attrition. By catching this localized detachment early, you can intervene months before HR detects a retention problem.',
        targetSelector: '[data-tutorial="executive-kpis"]',
        canvasTranslateY: 0,
    },
    {
        title: 'Narrative Synthesis',
        content: 'You don\'t need a data science degree to interpret this. Our system acts as your digital psychologist, synthesizing complex data into an actionable narrative briefing for your board.',
        targetSelector: '[data-tutorial="executive-briefing"]',
        canvasTranslateY: -800,
    },
];

export function TrackExecutive() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/';

    const handleDismiss = () => {
        fetch('/api/user/tutorial-status', {
            method: 'PATCH',
            body: JSON.stringify({ track: 'executive' }),
            headers: { 'Content-Type': 'application/json' },
        }).catch(() => {});
        router.push(returnTo);
    };

    return (
        <ScrollOverlayEngine steps={executiveSteps} onDismiss={handleDismiss}>
            <div className="w-full bg-[#050505] min-h-screen">
                <ExecutiveClientWrapper initialData={demoData} />
            </div>
        </ScrollOverlayEngine>
    );
}

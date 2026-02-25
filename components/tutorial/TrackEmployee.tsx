'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ScrollOverlayEngine, TutorialStep } from './ScrollOverlayEngine';
import { SurveyDemo } from './SurveyDemo';

const employeeSteps: TutorialStep[] = [
    {
        title: 'The 2-Minute Pulse',
        content: '10 questions. Once a week. The pulse check is designed to be lightweight — but the science behind it is anything but. Every question maps to a validated psychological construct that predicts organizational health outcomes.',
        targetSelector: '[data-tutorial="survey-progress"]',
        canvasTranslateY: 0,
    },
    {
        title: 'What We Are Really Measuring',
        content: 'Each question targets a specific dimension: Role Clarity, Cognitive Load, Trust, Withdrawal Risk, Autonomy, and more. These are not opinion questions — they are calibrated signals from Occupational Health Psychology.',
        targetSelector: '[data-tutorial="survey-question"]',
        canvasTranslateY: -150,
    },
    {
        title: 'Your Anonymity Guarantee',
        content: 'Your individual response is never visible to your manager. Responses are aggregated with at least 4 other team members before any pattern is surfaced. The system is designed to surface structural issues, not to surveil individuals.',
        targetSelector: '[data-tutorial="survey-options"]',
        canvasTranslateY: -200,
    },
    {
        title: 'From Response to Insight',
        content: 'Each dimension tag (like "COGNITIVE LOAD") links your response to a Bayesian model that tracks your team\'s latent state over time. Your answer this week updates the signal — and protects you and your colleagues from invisible accumulation.',
        targetSelector: '[data-tutorial="survey-scale"]',
        canvasTranslateY: -100,
    },
];

export function TrackEmployee() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/';

    const handleDismiss = () => {
        fetch('/api/user/tutorial-status', {
            method: 'PATCH',
            body: JSON.stringify({ track: 'employee' }),
            headers: { 'Content-Type': 'application/json' },
        }).catch(() => {});
        router.push(returnTo);
    };

    return (
        <ScrollOverlayEngine steps={employeeSteps} onDismiss={handleDismiss}>
            <div className="w-full bg-bg-base min-h-screen">
                <SurveyDemo />
            </div>
        </ScrollOverlayEngine>
    );
}

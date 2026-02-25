'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { SlideShow } from './SlideShow';
import type { Slide } from './SlideShow';
import { Activity, Brain, Shield, Zap, Calendar } from 'lucide-react';

const employeeSlides: Slide[] = [
    {
        icon: <Activity className="w-8 h-8" />,
        headline: 'Why the Pulse Check Exists',
        body: 'Your organisation uses inPsyq to maintain continuous visibility into collective psychological health — not to monitor individuals, but to detect structural dysfunction before it becomes irreversible. The weekly pulse is the input to a causal inference model that identifies what is creating pressure at the team and org level.',
        bullets: [
            'Replaces quarterly surveys that miss mid-cycle deterioration',
            'Detects burnout precursors weeks before they surface as attrition',
            'Generates team-specific intervention guidance for your manager',
            'Provides you with a private summary of your own contribution profile',
        ],
    },
    {
        icon: <Brain className="w-8 h-8" />,
        headline: 'The 10 Questions — What Each Measures',
        body: 'Every question targets one of ten distinct psychological dimensions derived from peer-reviewed Occupational Health Psychology instruments. Each item is designed so that your honest response provides a reliable signal for that dimension — and only that dimension.',
        bullets: [
            'Role Clarity — how clearly your responsibilities are defined',
            'Cognitive Load — how much mental overhead your work carries',
            'Dependency Strain — how blocked you are by external factors',
            'Trust in Leadership — psychological safety to raise concerns',
            'Peer Cohesion — quality of team relationships and collaboration',
            'Autonomy — your sense of control over how you work',
            'Recognition — whether your contributions are visible and valued',
            'Workload Balance — sustainability of your current pace',
            'Meaning Alignment — how connected you feel to the work\'s purpose',
            'Recovery Capacity — your ability to disengage and recharge',
        ],
    },
    {
        icon: <Shield className="w-8 h-8" />,
        headline: 'Anonymity — What Leadership Can and Cannot See',
        body: 'inPsyq enforces k-anonymity: no individual response is ever surfaced to leadership unless the team has a sufficient number of respondents. Your answer is aggregated with your team\'s responses before any index is computed. Your name is never attached to any number shown on a dashboard.',
        bullets: [
            'k-anonymity threshold is configured per deployment (minimum 5 respondents by default)',
            'If your team has fewer than k respondents in a week, that week is excluded from reporting',
            'You cannot be reverse-identified from any team-level index value',
            'Your private recommendation (visible only to you) is generated from your own signal, separately from the team aggregate',
        ],
    },
    {
        icon: <Zap className="w-8 h-8" />,
        headline: 'From Your Answer to the Team Briefing',
        body: 'Your response enters a Bayesian latent-state model that infers your psychological state across ten dimensions with uncertainty quantification. That inference is aggregated with your team\'s other responses. The team\'s combined signal drives the indices, the driver analysis, and the LLM briefing your team lead receives every Monday.',
        bullets: [
            'Your response → individual latent state update (private)',
            'Team latent states aggregated → team-level indices computed',
            'Causal attribution model identifies structural drivers',
            'LLM generates talking points from causal model output — not from your raw text',
        ],
    },
    {
        icon: <Calendar className="w-8 h-8" />,
        headline: 'Your Participation Matters — Here\'s Why',
        body: 'The model\'s accuracy depends directly on the consistency and completeness of weekly responses. A week where fewer than k employees respond produces no signal for that week. Consistent participation from the full team means the model can track trends, detect inflection points, and generate reliable confidence intervals.',
        bullets: [
            'Weekly cadence is what makes trend detection possible — one-off responses are less useful',
            'Skipping a week creates a gap in the time series that widens uncertainty bands',
            'Higher team response rates reduce the confidence interval on every index',
            'Your participation contributes to the quality of your own private summary as well as the team briefing',
        ],
    },
];

export function TutorialEmployee() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/tutorial';

    return (
        <SlideShow slides={employeeSlides} onComplete={() => router.push(returnTo)} />
    );
}

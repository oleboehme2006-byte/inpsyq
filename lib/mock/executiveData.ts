export const executiveMockData = {
    kpis: [
        {
            id: 'kpi-1',
            title: 'Strain Index',
            value: '72',
            score: 72,
            trend: 'up',
            trendValue: '+12%',
            semanticColor: 'strain',
            description: 'Workload & Pressure'
        },
        {
            id: 'kpi-2',
            title: 'Withdrawal Risk',
            value: '45',
            score: 45,
            trend: 'up',
            trendValue: '+5%',
            semanticColor: 'withdrawal',
            description: 'Disengagement Signs'
        },
        {
            id: 'kpi-3',
            title: 'Trust Gap',
            value: '28',
            score: 28,
            trend: 'stable',
            trendValue: '0%',
            semanticColor: 'trust-gap',
            description: 'Leadership Alignment'
        },
        {
            id: 'kpi-4',
            title: 'Engagement',
            value: '68',
            score: 68,
            trend: 'down',
            trendValue: '-3%',
            semanticColor: 'engagement',
            description: 'Active Participation'
        }
    ],
    teams: [
        {
            name: 'Product',
            status: 'Critical',
            members: 24,
            strain: 78,
            withdrawal: 45,
            trust: 30,
            engagement: 42,
            coverage: 92
        },
        {
            name: 'Engineering',
            status: 'At Risk',
            members: 42,
            strain: 65,
            withdrawal: 52,
            trust: 45,
            engagement: 60,
            coverage: 88
        },
        {
            name: 'Sales',
            status: 'At Risk',
            members: 35,
            strain: 45,
            withdrawal: 48,
            trust: 50,
            engagement: 62,
            coverage: 85
        },
        {
            name: 'Operations',
            status: 'Healthy',
            members: 18,
            strain: 35,
            withdrawal: 12,
            trust: 78,
            engagement: 85,
            coverage: 95
        },
        {
            name: 'Support',
            status: 'Healthy',
            members: 28,
            strain: 25,
            withdrawal: 15,
            trust: 82,
            engagement: 88,
            coverage: 98
        },
        {
            name: 'HR',
            status: 'Healthy',
            members: 8,
            strain: 30,
            withdrawal: 10,
            trust: 85,
            engagement: 90,
            coverage: 100
        }
    ],
    drivers: [
        {
            id: 'd1',
            label: 'Workload Pressure',
            score: 65,
            scope: 'Organization',
            trend: 'up',
            details: {
                mechanism: "Sustained high-velocity feature delivery without adequate recovery periods has created a cumulative cognitive load debt.",
                influence: "Primary impact on Product and Engineering teams, correlating with a 15% increase in error rates and declining creative output.",
                recommendation: "Implement mandatory 'cool-down' weeks between sprints and audit meeting density to recover deep-work capacity."
            }
        },
        {
            id: 'd2',
            label: 'Process Friction',
            score: 48,
            scope: 'Department',
            trend: 'stable',
            details: {
                mechanism: "Legacy deployment workflows and ambiguous cross-functional handoffs are creating repeated context-switching penalties.",
                influence: "Disproportionately affects Engineering velocity and QA cycles, creating a bottleneck that delays release cadences by avg. 2 days.",
                recommendation: "Prioritize CI/CD pipeline modernization and formalize API contracts between frontend and backend units."
            }
        },
        {
            id: 'd3',
            label: 'Communication Gaps',
            score: 38,
            scope: 'Localized',
            trend: 'down',
            details: {
                mechanism: "Asynchronous information flow between Product planning and Engineering execution is leading to late-stage requirements churn.",
                influence: "Localized to Product-Engineering interface, resulting in a 20% rework rate for recently shipped features.",
                recommendation: "Institute synchronous 'pre-mortem' alignment sessions and shared documentation artifacts before code freeze."
            }
        }
    ],
    watchlist: [
        {
            id: 'w1',
            team: 'Product',
            value: '+12%',
            severity: 'critical',
            message: "Critical strain with accelerating decline",
            details: {
                context: "Rapid expansion of product scope without corresponding resource allocation has pushed utilization beyond sustainable thresholds.",
                causality: "Driven by Q4 launch commitments overlapping with unexpected technical debt remediation cycles.",
                effects: "Accelerated burnout risk (Strain > 75) and a visible deterioration in psychosocial safety signals within 3 weeks.",
                criticality: "HIGH",
                recommendation: "Immediate scope reduction or temporary resource augmentation is required to prevent structural engagement collapse."
            }
        },
        {
            id: 'w2',
            team: 'Engineering',
            value: '+8%',
            severity: 'warning',
            message: "Workload pressure trending upward",
            details: {
                context: "Downstream pressure from Product delays is compressing development timelines, forcing prolonged high-intensity output.",
                causality: "Compounded by unaddressed 'Process Friction' driver, specifically within the deployment pipeline.",
                effects: "Emerging signs of 'Withdrawal' behavior (decreased PR reviews, camera-off meetings) indicating early disengagement.",
                criticality: "MID",
                recommendation: "Focus on technical enablement to remove friction; shield team from non-essential feature requests for 2 sprints."
            }
        },
        {
            id: 'w3',
            team: 'Support',
            value: '-5%',
            severity: 'info',
            message: "Engagement decline detected",
            details: {
                context: "Increasing ticket volume related to recent quality regressions is reducing morale and perceived efficacy.",
                causality: "Direct causal link to upstream 'Communication Gaps' resulting in undocumented feature behavior.",
                effects: "Slight erosion in 'Trust' scores, though overall engagement remains within resilient bounds for now.",
                criticality: "LOW",
                recommendation: "Establish a direct feedback loop with Engineering to accelerate bug triage and validate fixes."
            }
        }
    ]
};

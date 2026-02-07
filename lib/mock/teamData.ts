export const teamMockData = {
    teams: {
        'product': {
            name: 'Product',
            stats: { strain: 68, withdrawal: 55, trust: 42, engagement: 45 },
            trend: [
                { week: "W1", value: 40 }, { week: "W2", value: 42 }, { week: "W3", value: 45 },
                { week: "W4", value: 48 }, { week: "W5", value: 55 }, { week: "W6", value: 60 },
                { week: "W7", value: 62 }, { week: "W8", value: 65 }, { week: "W9", value: 68 }
            ],
            drivers: [
                { label: "Workload Pressure", score: 72, scope: "workload", description: "Sustained high task volume" },
                { label: "Deadline Intensity", score: 58, scope: "process", description: "Compressed delivery windows" },
                { label: "Context Switching", score: 45, scope: "cognitive", description: "Frequent priority changes" }
            ],
            actions: [
                { label: "Reduce Sprint Scope", description: "Immediate workload relief", priority: "IMMEDIATE", color: "strain" },
                { label: "Block Focus Time", description: "Minimize context switching", priority: "HIGH", color: "withdrawal" },
                { label: "Defer Tech Debt", description: "Prioritize delivery", priority: "NORMAL", color: "meta" }
            ],
            summary: "The team is in a critical state requiring immediate management attention. Primary concern is elevated strain (68%) trending upward."
        },
        'engineering': {
            name: 'Engineering',
            stats: { strain: 52, withdrawal: 38, trust: 28, engagement: 65 },
            trend: [
                { week: "W1", value: 30 }, { week: "W2", value: 32 }, { week: "W3", value: 35 },
                { week: "W4", value: 40 }, { week: "W5", value: 45 }, { week: "W6", value: 48 },
                { week: "W7", value: 50 }, { week: "W8", value: 51 }, { week: "W9", value: 52 }
            ],
            drivers: [
                { label: "Technical Debt", score: 65, scope: "tech", description: "Legacy system friction" },
                { label: "On-Call Load", score: 48, scope: "workload", description: "High incident volume" }
            ],
            actions: [
                { label: "Rotation Adjustment", description: "Balance on-call load", priority: "HIGH", color: "withdrawal" },
                { label: "Tech Debt Sprint", description: "Dedicated fix time", priority: "NORMAL", color: "meta" }
            ],
            summary: "Engineering shows moderate strain signals driven by technical debt and on-call fatigue."
        },
        'support': {
            name: 'Support', // Added Support team as per screenshot 4
            stats: { strain: 45, withdrawal: 35, trust: 32, engagement: 58 },
            trend: [
                { week: "W1", value: 50 }, { week: "W2", value: 48 }, { week: "W3", value: 46 },
                { week: "W4", value: 45 }, { week: "W5", value: 45 }, { week: "W6", value: 46 },
                { week: "W7", value: 45 }, { week: "W8", value: 44 }, { week: "W9", value: 45 }
            ],
            drivers: [
                { label: "Emotional Labor", score: 62, scope: "emotional", description: "High customer friction" },
                { label: "Tooling Lag", score: 55, scope: "process", description: "Slow dashboard response" }
            ],
            actions: [
                { label: "Tooling Upgrade", description: "Invest in faster dashboard", priority: "HIGH", color: "withdrawal" }
            ],
            summary: "Support is stable but showing signs of wear due to tooling inefficiencies."
        }
    }
};

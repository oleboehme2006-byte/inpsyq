/**
 * Onboarding Content Library
 * 
 * Contextual guidance for first-time users.
 * All text follows Phase 18 content rules:
 * - Under 140 chars when possible
 * - Answers "What does this mean?"
 * - No hype, no jargon
 */

// ============================================================================
// EXECUTIVE DASHBOARD GUIDANCE
// ============================================================================

export const EXECUTIVE_GUIDANCE = {
    // Dashboard purpose
    PURPOSE: {
        title: 'Organization Overview',
        description: 'Shows aggregated psychological metrics across all teams.',
    },

    // Organizational state
    STATE_OK: {
        title: 'Current State: Stable',
        description: 'Metrics are within expected ranges. No teams require attention.',
    },
    STATE_DEGRADED: {
        title: 'Current State: Monitoring',
        description: 'Some teams show elevated metrics. Review highlighted items.',
    },
    STATE_FAILED: {
        title: 'Current State: Data Pending',
        description: 'Metrics are being collected. Results will appear here.',
    },

    // Pressure origin
    PRESSURE_INTERNAL: {
        title: 'Internal Factors',
        description: 'Primary drivers are within team control.',
    },
    PRESSURE_EXTERNAL: {
        title: 'External Dependencies',
        description: 'Metrics are influenced by factors outside team control.',
    },
    PRESSURE_MIXED: {
        title: 'Mixed Sources',
        description: 'Both internal and external factors are contributing.',
    },

    // Attention priority
    ATTENTION_NONE: {
        title: 'No Attention Required',
        description: 'Current values do not indicate need for intervention.',
    },
    ATTENTION_MONITOR: {
        title: 'Observation Recommended',
        description: 'Values are elevated but not actionable. Track over time.',
    },
    ATTENTION_ACTION: {
        title: 'Review Suggested',
        description: 'Metrics indicate potential for intervention.',
    },
} as const;

// ============================================================================
// TEAM DASHBOARD GUIDANCE
// ============================================================================

export const TEAM_GUIDANCE = {
    // Current state
    STATE_CONTEXT: {
        title: 'Team Metrics',
        description: 'Psychological indicators derived from team responses.',
    },

    // Internal vs external
    DRIVERS_INTERNAL: {
        title: 'Internal Drivers',
        description: 'These factors originate within the team.',
    },
    DRIVERS_EXTERNAL: {
        title: 'External Dependencies',
        description: 'These factors are outside direct team control.',
    },
    DRIVERS_EXPLANATION: {
        title: 'Understanding Drivers',
        description: 'Drivers show what influences current metrics, not fault.',
    },

    // Action presence/absence
    ACTIONS_PRESENT: {
        title: 'Suggested Actions',
        description: 'Based on current metrics. Consider context before acting.',
    },
    ACTIONS_ABSENT: {
        title: 'No Actions Suggested',
        description: 'Metrics do not indicate intervention is needed now.',
    },
    ACTIONS_EXPLANATION: {
        title: 'About Actions',
        description: 'Actions are suggestions, not prescriptions.',
    },

    // Coordination
    COORDINATION_HINT: {
        title: 'Coordination Context',
        description: 'Cross-team dependencies may affect resolution timing.',
    },
} as const;

// ============================================================================
// INDEX EXPLANATIONS
// ============================================================================

export const INDEX_EXPLANATIONS = {
    strain: {
        name: 'Strain',
        what: 'Measures overall psychological load.',
        interpretation: 'Higher values indicate more pressure on the team.',
    },
    withdrawalRisk: {
        name: 'Withdrawal Risk',
        what: 'Likelihood of disengagement.',
        interpretation: 'Based on behavioral patterns and expressed sentiment.',
    },
    trustGap: {
        name: 'Trust Gap',
        what: 'Difference between expected and actual trust.',
        interpretation: 'Gap may indicate communication or transparency issues.',
    },
    engagement: {
        name: 'Engagement',
        what: 'Level of active participation.',
        interpretation: 'Higher values indicate stronger investment.',
    },
} as const;

// ============================================================================
// PROGRESSIVE DISCLOSURE HINTS
// ============================================================================

export const PROGRESSIVE_HINTS = {
    // First-time hints
    FIRST_VIEW_EXECUTIVE: {
        id: 'first-exec',
        content: 'This dashboard shows your organization at a glance.',
        dismissible: true,
    },
    FIRST_VIEW_TEAM: {
        id: 'first-team',
        content: 'These metrics reflect team-level patterns.',
        dismissible: true,
    },

    // Contextual hints
    EMPTY_ACTIONS: {
        id: 'empty-actions',
        content: 'No actions means metrics are within normal ranges.',
        dismissible: true,
    },
    HIGH_STRAIN: {
        id: 'high-strain',
        content: 'Elevated strain may warrant observation over time.',
        dismissible: true,
    },
    EXTERNAL_DOMINANT: {
        id: 'ext-dominant',
        content: 'External factors are primary. Internal action may be limited.',
        dismissible: true,
    },
} as const;

// ============================================================================
// DEMO MODE OVERLAYS
// ============================================================================

export const DEMO_OVERLAYS = {
    BANNER: {
        text: 'Demo Mode — Viewing with contextual explanations enabled.',
        dismissible: true,
    },
    DATA_NOTE: {
        text: 'Data shown is real. Explanations are for onboarding purposes.',
        position: 'bottom',
    },
} as const;

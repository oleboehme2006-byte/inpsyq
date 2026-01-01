/**
 * User-Facing Content Library
 * 
 * Centralized text for all user-facing messaging.
 * Rules applied:
 * - No hype or marketing language
 * - Every sentence answers: "What does this mean for the user?"
 * - Neutral, clear, brief
 */

// ============================================================================
// EMPTY STATES
// ============================================================================

export const EMPTY_STATES = {
    // Dashboard: No data at all
    DASHBOARD_NO_DATA: {
        title: 'Data not yet available',
        description: 'Weekly metrics will appear here after the first data collection.',
        suggestion: 'Data is typically generated each Monday.',
    },

    // Dashboard: Data exists but interpretation missing
    DASHBOARD_NO_INTERPRETATION: {
        title: 'Insights pending',
        description: 'Metrics are available, but narrative insights are still being generated.',
        suggestion: 'Check back shortly, or review the raw metrics below.',
    },

    // Actions panel: No actions to show
    ACTIONS_NONE: {
        title: 'No actions at this time',
        description: 'Current metrics do not indicate any required interventions.',
    },

    // Team has no members
    TEAM_NO_MEMBERS: {
        title: 'No team members found',
        description: 'Add team members to begin collecting data.',
    },

    // No historical data for trend
    TREND_INSUFFICIENT_DATA: {
        title: 'Trend data building',
        description: 'At least 3 weeks of data are needed to show trends.',
    },
} as const;

// ============================================================================
// ERROR STATES
// ============================================================================

export const ERROR_STATES = {
    // Generic API error
    GENERIC_ERROR: {
        title: 'Something went wrong',
        description: 'We encountered an issue loading this data. Please try again.',
        suggestion: 'If the problem persists, contact support.',
    },

    // Pipeline failure
    PIPELINE_FAILED: {
        title: 'Data generation failed',
        description: 'The weekly data pipeline encountered an error.',
        suggestion: 'Check the ops dashboard for details.',
    },

    // Auth error
    ACCESS_DENIED: {
        title: 'Access denied',
        description: 'You do not have permission to view this content.',
        suggestion: 'Contact your administrator if you believe this is an error.',
    },
} as const;

// ============================================================================
// STATUS MESSAGES
// ============================================================================

export const STATUS_MESSAGES = {
    // Used in status badges
    OK: 'Data complete',
    DEGRADED: 'Partial data',
    FAILED: 'Data unavailable',

    // Longer descriptions
    OK_LONG: 'All weekly metrics and interpretations are current.',
    DEGRADED_LONG: 'Metrics are available. Some insights are pending.',
    FAILED_LONG: 'Weekly data has not been generated for this period.',
} as const;

// ============================================================================
// ACTION DESCRIPTIONS
// ============================================================================

export const ACTION_DESCRIPTIONS = {
    // Internal driver actions
    WORKLOAD_HIGH: {
        label: 'Address workload concerns',
        description: 'Team members report elevated workload. Consider redistributing tasks.',
    },
    COLLABORATION_LOW: {
        label: 'Review collaboration patterns',
        description: 'Cross-team interaction is below expected levels. Identify blockers.',
    },
    LEADERSHIP_VISIBILITY: {
        label: 'Increase leadership visibility',
        description: 'Team members indicate limited leadership contact. Schedule check-ins.',
    },

    // External dependency actions
    EXTERNAL_DEPENDENCY_IMPACT: {
        label: 'Monitor external dependency',
        description: 'External factors are affecting team metrics. Track and reassess.',
    },

    // Lock/ops actions
    STUCK_LOCK: {
        label: 'Release stuck lock',
        description: 'A data processing lock has been held too long. Manual release may be required.',
    },
} as const;

// ============================================================================
// SECTION HEADERS
// ============================================================================

export const SECTION_HEADERS = {
    WEEKLY_SUMMARY: 'This Week',
    TREND_ANALYSIS: 'Trend',
    ATTRIBUTION: 'Key Drivers',
    ACTIONS: 'Recommended Actions',
    EXTERNAL_FACTORS: 'External Factors',
    DATA_QUALITY: 'Data Quality',
} as const;

// ============================================================================
// TOOLTIPS
// ============================================================================

export const TOOLTIPS = {
    STRAIN_INDEX: 'Measures overall psychological load on the team. Higher values indicate more strain.',
    WITHDRAWAL_RISK: 'Likelihood that team members may disengage. Based on behavioral signals.',
    TRUST_GAP: 'Difference between expected and actual trust levels within the team.',
    ENGAGEMENT: 'Level of active participation and investment in team activities.',

    INTERNAL_DRIVERS: 'Factors within the team that influence current metrics.',
    EXTERNAL_DEPENDENCIES: 'Factors outside the team that are affecting metrics.',

    DATA_COVERAGE: 'Percentage of expected data that was successfully collected.',
    DATA_CONFIDENCE: 'Statistical confidence in the displayed values. Higher is better.',
} as const;

/**
 * Canonical Status Definitions
 * 
 * SINGLE SOURCE OF TRUTH for all status values across the application.
 * Used by: dashboard APIs, ops health, alerts, and UI.
 * 
 * STATUS DEFINITIONS:
 * 
 * OK        - All required data is present and processing completed successfully.
 *             • Weekly product exists
 *             • Active interpretation exists
 *             • No stuck locks
 * 
 * DEGRADED  - Partial data available; system is operational but quality is reduced.
 *             • Weekly product exists BUT interpretation is missing
 *             • OR: Data is stale (older than expected refresh cycle)
 *             • User can still view data, but insights may be incomplete
 * 
 * FAILED    - Critical data is missing; the feature cannot function.
 *             • No weekly product exists for the target week
 *             • OR: Pipeline failed to complete
 *             • User sees "Data unavailable" messaging
 * 
 * UNKNOWN   - Status cannot be determined (e.g., no teams exist yet).
 * 
 * MONITOR_ONLY - An issue exists but requires observation, not immediate action.
 *                Used for: high variance periods, external dependency impacts.
 * 
 * ACTION_REQUIRED - An issue exists that requires human intervention.
 *                   Used for: stuck locks, repeated failures, coverage gaps.
 */

export type TeamStatus = 'OK' | 'DEGRADED' | 'FAILED' | 'UNKNOWN';

export type IssueCategory = 'MONITOR_ONLY' | 'ACTION_REQUIRED' | 'NONE';

export type DriverSource = 'INTERNAL' | 'EXTERNAL' | 'MIXED' | 'UNKNOWN';

/**
 * Determine team status based on data availability.
 */
export function deriveTeamStatus(params: {
    hasProduct: boolean;
    hasInterpretation: boolean;
    hasStuckLock?: boolean;
}): TeamStatus {
    const { hasProduct, hasInterpretation, hasStuckLock } = params;

    // FAILED: No product at all
    if (!hasProduct) {
        return 'FAILED';
    }

    // DEGRADED: Product exists but interpretation missing or lock stuck
    if (!hasInterpretation || hasStuckLock) {
        return 'DEGRADED';
    }

    // OK: Both exist, no issues
    return 'OK';
}

/**
 * Determine if an issue requires action or just monitoring.
 */
export function categorizeIssue(params: {
    status: TeamStatus;
    hasStuckLock: boolean;
    recentFailures: number;
    externalDominant: boolean;
}): IssueCategory {
    const { status, hasStuckLock, recentFailures, externalDominant } = params;

    // No issue
    if (status === 'OK') {
        return 'NONE';
    }

    // Action required for stuck locks or repeated failures
    if (hasStuckLock || recentFailures >= 2) {
        return 'ACTION_REQUIRED';
    }

    // External-dominant issues are typically monitor-only
    if (externalDominant) {
        return 'MONITOR_ONLY';
    }

    // Default: degraded without clear cause = monitor
    return 'MONITOR_ONLY';
}

/**
 * User-facing labels for status values.
 * These are neutral, brief, and explainable.
 */
export const STATUS_LABELS: Record<TeamStatus, string> = {
    OK: 'Data complete',
    DEGRADED: 'Partial data',
    FAILED: 'Data unavailable',
    UNKNOWN: 'Status pending',
};

/**
 * User-facing descriptions for status values.
 * Each answers: "What does this mean for the user?"
 */
export const STATUS_DESCRIPTIONS: Record<TeamStatus, string> = {
    OK: 'All weekly metrics and interpretations are available.',
    DEGRADED: 'Metrics are available, but some insights are pending.',
    FAILED: 'Weekly data has not been generated. Check pipeline status.',
    UNKNOWN: 'Team status will be available after the first data collection.',
};

/**
 * Severity mapping for alerts.
 */
export function getAlertSeverityForStatus(status: TeamStatus): 'critical' | 'warning' | 'info' {
    switch (status) {
        case 'FAILED':
            return 'critical';
        case 'DEGRADED':
            return 'warning';
        default:
            return 'info';
    }
}

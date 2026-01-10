/**
 * Data Retention Constants
 * 
 * Defines retention windows for different data categories.
 * Used by cleanup jobs and referenced in Privacy Policy.
 */

/**
 * Raw session response data retention (months).
 * After this period, raw responses may be purged.
 */
export const SESSION_DATA_RETENTION_MONTHS = 12;

/**
 * Invite token expiration (hours).
 * Already enforced by existing invite flow.
 */
export const INVITE_EXPIRATION_HOURS = 72;

/**
 * Aggregated metrics retention.
 * Non-identifiable aggregate data is retained indefinitely.
 */
export const AGGREGATES_RETENTION = 'indefinite';

/**
 * Audit log retention (months).
 */
export const AUDIT_LOG_RETENTION_MONTHS = 24;

/**
 * Get retention date threshold for session data.
 * Records older than this date may be purged.
 */
export function getSessionRetentionThreshold(): Date {
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() - SESSION_DATA_RETENTION_MONTHS);
    return threshold;
}

/**
 * Get retention summary for documentation.
 */
export function getRetentionSummary(): Record<string, string> {
    return {
        'Session Responses': `${SESSION_DATA_RETENTION_MONTHS} months`,
        'Aggregated Metrics': 'Indefinite (non-identifiable)',
        'Invite Tokens': `${INVITE_EXPIRATION_HOURS} hours (auto-expire)`,
        'Audit Logs': `${AUDIT_LOG_RETENTION_MONTHS} months`,
    };
}

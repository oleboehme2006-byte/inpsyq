/**
 * Session Security Module
 * 
 * Enforces absolute lifetime and idle timeout for sessions.
 */

// Session limits
export const SESSION_LIMITS = {
    ABSOLUTE_LIFETIME_DAYS: 30,  // Max session age
    IDLE_TIMEOUT_DAYS: 7,        // Inactivity timeout
    FRESH_SESSION_MINUTES: 10,   // For destructive admin actions
};

/**
 * Check if a session is expired based on creation time.
 */
export function isSessionExpired(createdAt: Date): boolean {
    const maxAge = SESSION_LIMITS.ABSOLUTE_LIFETIME_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - createdAt.getTime() > maxAge;
}

/**
 * Check if a session is idle (no activity within timeout).
 */
export function isSessionIdle(lastSeenAt: Date): boolean {
    const idleTimeout = SESSION_LIMITS.IDLE_TIMEOUT_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - lastSeenAt.getTime() > idleTimeout;
}

/**
 * Check if session is fresh enough for destructive actions.
 */
export function isSessionFresh(lastSeenAt: Date): boolean {
    const freshWindow = SESSION_LIMITS.FRESH_SESSION_MINUTES * 60 * 1000;
    return Date.now() - lastSeenAt.getTime() < freshWindow;
}

/**
 * Get session expiry date.
 */
export function getSessionExpiry(createdAt: Date): Date {
    const expiry = new Date(createdAt);
    expiry.setDate(expiry.getDate() + SESSION_LIMITS.ABSOLUTE_LIFETIME_DAYS);
    return expiry;
}

/**
 * Validate session for normal operations.
 * Returns { valid: boolean, reason?: string }
 */
export function validateSession(createdAt: Date, lastSeenAt: Date): { valid: boolean; reason?: string } {
    if (isSessionExpired(createdAt)) {
        return { valid: false, reason: 'Session expired (max lifetime exceeded)' };
    }

    if (isSessionIdle(lastSeenAt)) {
        return { valid: false, reason: 'Session expired (idle timeout)' };
    }

    return { valid: true };
}

/**
 * Validate session for destructive admin operations.
 * Requires fresh session in addition to normal checks.
 */
export function validateSessionForDestructive(
    createdAt: Date,
    lastSeenAt: Date
): { valid: boolean; reason?: string; requiresReauth?: boolean } {
    const basic = validateSession(createdAt, lastSeenAt);
    if (!basic.valid) {
        return basic;
    }

    if (!isSessionFresh(lastSeenAt)) {
        return {
            valid: false,
            reason: 'Session not fresh - reauthentication required for this action',
            requiresReauth: true,
        };
    }

    return { valid: true };
}

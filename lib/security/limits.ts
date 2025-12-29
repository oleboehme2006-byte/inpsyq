/**
 * SECURITY LIMITS
 * 
 * Hard-coded safety caps for abuse prevention.
 * These limits are widely scoped to prevent DoS or cost overruns.
 */

export const SECURITY_LIMITS = {
    // INTAKE LIMITS
    MAX_SESSIONS_PER_WEEK: 5,        // Max active rating sessions per user/week
    MAX_REPLAYS_PER_MINUTE: 10,      // Prevent script spam
    SESSION_EXPIRY_MINUTES: 30,      // Sessions valid for 30m

    // ACCESS LIMITS
    MAX_INVITES_PER_ORG: 50,         // Max outstanding invites
    INVITE_EXPIRY_HOURS: 48,         // Invites expire in 48h (strict)

    // RUNNER LIMITS
    MIN_RUN_INTERVAL_MINUTES: 10,    // Manual trigger throttle
    MAX_WEEKS_BACKFILL: 12,          // Max backfill depth

    // INTERPRETATION LIMITS
    MAX_GENERATIONS_PER_WEEK: 5,     // Per Team (cost control)
};

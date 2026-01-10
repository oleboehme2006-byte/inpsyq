/**
 * Rate Limiter (In-Memory Sliding Window)
 * 
 * Server-side rate limiting for abuse prevention.
 * Uses sliding window algorithm with per-IP and per-identity tracking.
 */

interface RateLimitEntry {
    timestamps: number[];
    blocked_until?: number;
}

// In-memory store (per-instance; production may use Redis)
const store = new Map<string, RateLimitEntry>();

// Configuration
export const RATE_LIMITS = {
    AUTH_REQUEST_LINK: { window: 60_000, max: 5, block: 300_000 },   // 5/min, block 5min
    AUTH_CONSUME: { window: 60_000, max: 10, block: 300_000 },       // 10/min
    ADMIN_MUTATION: { window: 60_000, max: 20, block: 60_000 },      // 20/min
    ADMIN_DESTRUCTIVE: { window: 600_000, max: 3, block: 600_000 },  // 3/10min
};

export type RateLimitType = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    blocked_until?: number;
}

/**
 * Check and update rate limit for a key.
 */
export function checkRateLimit(type: RateLimitType, key: string): RateLimitResult {
    const config = RATE_LIMITS[type];
    const now = Date.now();
    const fullKey = `${type}:${key}`;

    let entry = store.get(fullKey);

    // Check if blocked
    if (entry?.blocked_until && entry.blocked_until > now) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.blocked_until,
            blocked_until: entry.blocked_until,
        };
    }

    // Initialize or clean old entries
    if (!entry) {
        entry = { timestamps: [] };
    }

    // Sliding window: remove old timestamps
    const windowStart = now - config.window;
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);

    // Check limit
    if (entry.timestamps.length >= config.max) {
        // Block
        entry.blocked_until = now + config.block;
        store.set(fullKey, entry);

        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.blocked_until,
            blocked_until: entry.blocked_until,
        };
    }

    // Add timestamp
    entry.timestamps.push(now);
    store.set(fullKey, entry);

    return {
        allowed: true,
        remaining: config.max - entry.timestamps.length,
        resetAt: now + config.window,
    };
}

/**
 * Create a rate limit key from request.
 * Uses IP + optional identity for isolation.
 */
export function getRateLimitKey(ip: string, identity?: string): string {
    if (identity) {
        return `${ip}:${identity}`;
    }
    return ip;
}

/**
 * Get client IP from request.
 */
export function getClientIP(headers: Headers): string {
    // Check common proxy headers
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIP = headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Fallback
    return 'unknown';
}

/**
 * Clear rate limit for a key (for testing).
 */
export function clearRateLimit(type: RateLimitType, key: string): void {
    store.delete(`${type}:${key}`);
}

/**
 * Clear all rate limits (for testing).
 */
export function clearAllRateLimits(): void {
    store.clear();
}

/**
 * SUBMIT RATE LIMIT — Per-user sliding-window rate limiter
 *
 * Limits /api/measurement/submit to LIMIT requests per WINDOW_MS per user.
 *
 * Implementation note: this is an in-memory limiter scoped to a single
 * serverless function instance. Vercel may run multiple instances in parallel,
 * so this does not enforce a global rate limit — it prevents burst abuse
 * within a single instance (the most common attack vector for a survey endpoint).
 * For a global limit, swap the Map for a Vercel KV or Redis store.
 */

const WINDOW_MS = 60_000;   // 60-second sliding window
const LIMIT = 30;            // max requests per window per user

export interface RateLimitResult {
    allowed: boolean;
    retryAfterSecs: number;
}

// userId → sorted list of request timestamps (epoch ms) within the window
const store = new Map<string, number[]>();

// Prune users whose last request was more than 2 windows ago to prevent
// unbounded Map growth in long-lived instances.
let lastPrune = Date.now();
function maybePrune(now: number) {
    if (now - lastPrune < WINDOW_MS * 2) return;
    lastPrune = now;
    const cutoff = now - WINDOW_MS * 2;
    for (const [userId, timestamps] of store) {
        if (timestamps.length === 0 || timestamps[timestamps.length - 1] < cutoff) {
            store.delete(userId);
        }
    }
}

export function checkRateLimit(userId: string): RateLimitResult {
    const now = Date.now();
    maybePrune(now);

    const windowStart = now - WINDOW_MS;
    const existing = store.get(userId) ?? [];

    // Drop timestamps outside the current window (sliding)
    const inWindow = existing.filter((ts) => ts > windowStart);

    if (inWindow.length >= LIMIT) {
        // Oldest timestamp in window tells us when the window opens up
        const oldestInWindow = inWindow[0];
        const retryAfterMs = oldestInWindow + WINDOW_MS - now;
        return {
            allowed: false,
            retryAfterSecs: Math.ceil(retryAfterMs / 1000),
        };
    }

    inWindow.push(now);
    store.set(userId, inWindow);
    return { allowed: true, retryAfterSecs: 0 };
}

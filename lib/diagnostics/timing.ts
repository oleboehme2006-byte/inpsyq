/**
 * TIMING DIAGNOSTICS
 * 
 * Lightweight in-memory performance tracking.
 * Stores stats for p50/p95 approximation.
 * Reset on server restart or manual clear.
 */

interface TimingStats {
    count: number;
    totalMs: number;
    minMs: number;
    maxMs: number;
    lastMs: number;
    histogram: number[]; // Simple bucket storage for p95 calc (keep limited size)
}

const metrics: Record<string, TimingStats> = {};
const MAX_HISTORY = 1000; // Keep last N samples per label for simple p95

export async function measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
        const result = await fn();
        record(label, performance.now() - start);
        return result;
    } catch (e) {
        record(label + ':error', performance.now() - start);
        throw e;
    }
}

function record(label: string, durationMs: number) {
    if (!metrics[label]) {
        metrics[label] = {
            count: 0,
            totalMs: 0,
            minMs: durationMs,
            maxMs: durationMs,
            lastMs: durationMs,
            histogram: []
        };
    }

    const stat = metrics[label];
    stat.count++;
    stat.totalMs += durationMs;
    stat.lastMs = durationMs;
    stat.minMs = Math.min(stat.minMs, durationMs);
    stat.maxMs = Math.max(stat.maxMs, durationMs);

    // Maintenance: Keep histogram small-ish (Reservoir sampling would be better but this is MVP)
    if (stat.histogram.length < MAX_HISTORY) {
        stat.histogram.push(durationMs);
    } else {
        // Random replace approx 10% of time to keep fresh? 
        // Or just Drop? Let's just slice end for rolling window effect approx
        stat.histogram.shift();
        stat.histogram.push(durationMs);
    }
}

export function getMetrics() {
    const results: Record<string, any> = {};

    for (const [label, stat] of Object.entries(metrics)) {
        // Calculate P50, P95
        const sorted = [...stat.histogram].sort((a, b) => a - b);
        const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
        const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;

        results[label] = {
            count: stat.count,
            avgMs: Math.round(stat.totalMs / stat.count),
            p50Ms: Math.round(p50),
            p95Ms: Math.round(p95),
            minMs: Math.round(stat.minMs),
            maxMs: Math.round(stat.maxMs),
            lastMs: Math.round(stat.lastMs)
        };
    }

    return results;
}

export function resetMetrics() {
    for (const key in metrics) delete metrics[key];
}

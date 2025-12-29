/**
 * DASHBOARD CACHE — Simple Server-Side Cache
 * 
 * Cache key: (org_id, team_id, week_start, compute_version, hash)
 * Invalidates when input_hash changes.
 */

import { query } from '@/db/client';
import { assertCacheKeyScoped } from '@/lib/tenancy/assertions';

// ============================================================================
// Types
// ============================================================================

export interface CacheEntry<T> {
    data: T;
    inputHash: string;
    cachedAt: Date;
}

// ============================================================================
// In-Memory Cache (Simple for MVP)
// ============================================================================

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Build cache key from components.
 */
export function buildCacheKey(
    type: 'team' | 'executive',
    orgId: string,
    teamId: string | null,
    weekStart: string,
    computeVersion: string,
    hash: string
): string {
    const key = `${type}:${orgId}:${teamId || 'all'}:${weekStart}:${computeVersion}:${hash}`;
    assertCacheKeyScoped(key, orgId);
    return key;
}

/**
 * Get from cache if valid.
 */
export function getFromCache<T>(key: string): CacheEntry<T> | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    // Check TTL
    const age = Date.now() - entry.cachedAt.getTime();
    if (age > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }

    return entry;
}

/**
 * Set cache entry.
 */
export function setCache<T>(key: string, data: T, inputHash: string): void {
    cache.set(key, {
        data,
        inputHash,
        cachedAt: new Date(),
    });
}

/**
 * Clear cache for a specific org/team.
 */
export function invalidateCache(orgId: string, teamId?: string): void {
    const prefix = teamId ? `team:${orgId}:${teamId}` : orgId;
    const keys = Array.from(cache.keys());
    for (const key of keys) {
        if (key.includes(prefix)) {
            cache.delete(key);
        }
    }
}

/**
 * Check if cache entry matches current input hash.
 */
export async function isCacheValid(
    orgId: string,
    teamId: string,
    weekStart: string
): Promise<{ valid: boolean; currentHash: string | null }> {
    const result = await query(
        `SELECT input_hash FROM org_aggregates_weekly
     WHERE org_id = $1 AND team_id = $2 AND week_start = $3`,
        [orgId, teamId, weekStart]
    );

    const currentHash = result.rows[0]?.input_hash || null;
    return { valid: !!currentHash, currentHash };
}

/**
 * Clear entire cache.
 */
export function clearAllCache(): void {
    cache.clear();
}

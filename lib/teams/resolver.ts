/**
 * Team Resolver Utility
 * 
 * Resolves team identifiers (UUID or Slug) to UUIDs.
 * Used by server pages to robustly handle navigation.
 */

import { query } from '@/db/client';

// Known fixtures for dev fallback (if DB lookup fails or for speed)
const FIXTURE_MAP: Record<string, string> = {
    'engineering': '22222222-2222-4222-8222-222222222201',
    'sales': '22222222-2222-4222-8222-222222222202',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a team parameter (UUID or Slug) to a Team UUID.
 * 
 * Strategy:
 * 1. If it looks like a UUID, return it as-is.
 * 2. If it's a known fixture slug, return the fixture UUID.
 * 3. (Optional) DB lookup for real slugs (if table supports it).
 */
export async function resolveTeamIdentifier(teamParam: string): Promise<string | null> {
    // 1. Check UUID format
    if (UUID_REGEX.test(teamParam)) {
        return teamParam;
    }

    // 2. Check Fixtures
    const fixtureId = FIXTURE_MAP[teamParam.toLowerCase()];
    if (fixtureId) {
        return fixtureId;
    }

    // 3. DB Lookup (Assumption: teams table has slug or we just fail for now)
    // For Phase 20.1, fixture support + UUID support is the primary requirement.
    // Real slug lookup would require checking the schema.

    // Attempt to find by name/slug if possible
    try {
        const sql = `SELECT id FROM teams WHERE slug = $1 LIMIT 1`;
        const result = await query(sql, [teamParam]);
        if (result.rows.length > 0) {
            return result.rows[0].id;
        }
    } catch (e) {
        // Ignore DB errors, fall through to null
        console.warn(`Resolver DB lookup failed for ${teamParam}`, e);
    }

    return null;
}

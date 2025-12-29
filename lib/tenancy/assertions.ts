/**
 * TENANCY ASSERTIONS
 * 
 * Strict runtime checks for tenant isolation.
 * These functions throw explicit errors if isolation is violated.
 * 
 * DESIGN RULE: "Fail Hard"
 * If we detect a mismatch between an expected Org ID and an Actual Org ID,
 * we crash the request rather than risking data leakage.
 */

export class TenancyViolationError extends Error {
    constructor(message: string, public details?: any) {
        super(message);
        this.name = 'TenancyViolationError';
    }
}

/**
 * Assert that two Org IDs match.
 * @param expected The Org ID presumed by the context (e.g., auth token)
 * @param actual The Org ID found in the data (e.g., database row)
 * @param context Description of extraction point for logging
 */
export function assertSameOrg(expected: string, actual: string, context: string) {
    if (expected !== actual) {
        throw new TenancyViolationError(
            `Tenant Mismatch in ${context}`,
            { expected, actual }
        );
    }
}

/**
 * Assert that a Team ID belongs to an Org ID.
 * NOTE: This requires looking up the team's org or having the team object.
 * This is a synchronous assertion helper assuming we already have the team object.
 */
export function assertTeamBelongsToOrg(team: { id: string; orgId: string }, orgId: string) {
    if (team.orgId !== orgId) {
        throw new TenancyViolationError(
            `Team ${team.id} does not belong to Org ${orgId}`,
            { teamOrg: team.orgId, requestOrg: orgId }
        );
    }
}

/**
 * Assert that an input object with an orgId property matches the context orgId.
 */
export function assertTenantScopedInput(input: { orgId: string }, orgId: string) {
    if (input.orgId !== orgId) {
        throw new TenancyViolationError(
            `Input payload mismatch for Org ${orgId}`,
            { inputOrg: input.orgId }
        );
    }
}

/**
 * Assert that a cache key contains the Org ID.
 * This is a heuristic check to prevent developers from forgetting scoping.
 */
export function assertCacheKeyScoped(key: string, orgId: string) {
    if (!key.includes(orgId)) {
        throw new TenancyViolationError(
            `Cache key potentially unsafe: does not contain Org ID ${orgId}`,
            { key }
        );
    }
}

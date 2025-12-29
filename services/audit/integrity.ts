/**
 * INTEGRITY LOGGER
 * 
 * Helper for logging critical integrity violations.
 */

import { logAuditEvent } from './events';

export async function logIntegrityViolation(
    orgId: string,
    context: string,
    details: any
) {
    await logAuditEvent(orgId, null, 'INTEGRITY_VIOLATION', {
        context,
        details,
        timestamp: Date.now()
    });
    console.error(`[INTEGRITY] Violation in ${context}`, JSON.stringify(details));
}

export async function logAccessViolation(
    orgId: string,
    userId: string | undefined,
    resource: string
) {
    await logAuditEvent(orgId, null, 'ACCESS_VIOLATION', {
        userId,
        resource,
        timestamp: Date.now()
    });
}

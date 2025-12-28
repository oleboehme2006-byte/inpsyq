/**
 * INVITE — Invite Token Generation and Validation
 * 
 * Creates and validates HMAC-signed invite tokens for org/team provisioning.
 */

import { createHmac } from 'crypto';
import { Role, isValidRole } from './roles';

// ============================================================================
// Configuration
// ============================================================================

const INVITE_SECRET = process.env.INVITE_SECRET || 'dev-invite-secret-change-me';
const DEFAULT_EXPIRY_HOURS = 72;

// ============================================================================
// Types
// ============================================================================

export interface InvitePayload {
    orgId: string;
    teamId?: string;
    role: Role;
    email?: string;
    expiresAt: number; // Unix timestamp ms
    createdAt: number;
}

export interface InviteToken {
    payload: InvitePayload;
    signature: string;
}

export type ParsedInvite =
    | { ok: true; payload: InvitePayload }
    | { ok: false; error: string };

// ============================================================================
// Token Creation
// ============================================================================

/**
 * Create an invite token for a given org/team/role.
 */
export function createInviteToken(params: {
    orgId: string;
    teamId?: string;
    role: Role;
    email?: string;
    expiresInHours?: number;
}): string {
    const now = Date.now();
    const expiresIn = (params.expiresInHours ?? DEFAULT_EXPIRY_HOURS) * 60 * 60 * 1000;

    const payload: InvitePayload = {
        orgId: params.orgId,
        teamId: params.teamId,
        role: params.role,
        email: params.email,
        expiresAt: now + expiresIn,
        createdAt: now,
    };

    const payloadStr = JSON.stringify(payload);
    const payloadB64 = Buffer.from(payloadStr).toString('base64url');
    const signature = signPayload(payloadB64);

    return `${payloadB64}.${signature}`;
}

/**
 * Parse and validate an invite token.
 */
export function parseInviteToken(token: string): ParsedInvite {
    if (!token || typeof token !== 'string') {
        return { ok: false, error: 'Invalid token format' };
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
        return { ok: false, error: 'Invalid token format: expected payload.signature' };
    }

    const [payloadB64, signature] = parts;

    // Verify signature
    const expectedSig = signPayload(payloadB64);
    if (signature !== expectedSig) {
        return { ok: false, error: 'Invalid token signature' };
    }

    // Decode payload
    let payload: InvitePayload;
    try {
        const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
        payload = JSON.parse(payloadStr);
    } catch {
        return { ok: false, error: 'Invalid token payload' };
    }

    // Validate payload structure
    if (!payload.orgId || typeof payload.orgId !== 'string') {
        return { ok: false, error: 'Invalid token: missing orgId' };
    }
    if (!isValidRole(payload.role)) {
        return { ok: false, error: 'Invalid token: invalid role' };
    }
    if (typeof payload.expiresAt !== 'number') {
        return { ok: false, error: 'Invalid token: missing expiresAt' };
    }

    // Check expiry
    if (Date.now() > payload.expiresAt) {
        return { ok: false, error: 'Token has expired' };
    }

    return { ok: true, payload };
}

// ============================================================================
// Helpers
// ============================================================================

function signPayload(payloadB64: string): string {
    const hmac = createHmac('sha256', INVITE_SECRET);
    hmac.update(payloadB64);
    return hmac.digest('base64url');
}

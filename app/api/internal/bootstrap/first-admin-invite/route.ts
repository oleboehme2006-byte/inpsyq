/**
 * FIRST ADMIN INVITE BOOTSTRAP — One-time admin invite creation
 * 
 * POST /api/internal/bootstrap/first-admin-invite
 * 
 * Security:
 * - Requires x-bootstrap-secret header matching BOOTSTRAP_SECRET env var
 * - Returns 404 if BOOTSTRAP_SECRET not set (in production)
 * - Returns 409 if admin already exists for org
 * - Never logs email or secrets
 */

import { NextResponse } from 'next/server';
import { query } from '@/db/client';
import { createInviteToken } from '@/lib/access/invite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOOTSTRAP_SECRET = process.env.BOOTSTRAP_SECRET;
const IS_PROD = process.env.NODE_ENV === 'production';

export async function POST(req: Request) {
    const requestId = crypto.randomUUID();

    // Hard gate: In production, BOOTSTRAP_SECRET must be set
    if (IS_PROD && !BOOTSTRAP_SECRET) {
        return NextResponse.json(
            { error: 'Not Found', code: 'NOT_FOUND' },
            { status: 404 }
        );
    }

    // Verify bootstrap secret
    const providedSecret = req.headers.get('x-bootstrap-secret');
    if (!providedSecret || providedSecret !== BOOTSTRAP_SECRET) {
        return NextResponse.json(
            { error: 'Unauthorized', code: 'UNAUTHORIZED' },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { email, orgId } = body;

        // Validate input
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Valid email is required', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        if (!orgId || typeof orgId !== 'string') {
            return NextResponse.json(
                { error: 'orgId is required', code: 'VALIDATION_ERROR', request_id: requestId },
                { status: 400 }
            );
        }

        // Check if org exists
        const orgResult = await query(`SELECT org_id FROM orgs WHERE org_id = $1`, [orgId]);
        if (orgResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Organization not found', code: 'NOT_FOUND', request_id: requestId },
                { status: 404 }
            );
        }

        // Check if admin already exists for this org
        const adminCheck = await query(
            `SELECT m.membership_id FROM memberships m WHERE m.org_id = $1 AND m.role = 'ADMIN' LIMIT 1`,
            [orgId]
        );

        if (adminCheck.rows.length > 0) {
            return NextResponse.json(
                { ok: false, code: 'ALREADY_BOOTSTRAPPED', message: 'Admin already exists for this organization', request_id: requestId },
                { status: 409 }
            );
        }

        // Create invite token
        const normalizedEmail = email.toLowerCase().trim();
        const inviteToken = createInviteToken({
            orgId,
            role: 'ADMIN',
            email: normalizedEmail,
            expiresInHours: 7 * 24, // 7 days
        });

        // Store invite in active_invites
        const signature = inviteToken.split('.')[1];
        await query(`
            INSERT INTO active_invites (payload_signature, org_id, email, expires_at, max_uses, uses_count)
            VALUES ($1, $2, $3, NOW() + INTERVAL '7 days', 1, 0)
        `, [signature, orgId, normalizedEmail]);

        // Log success without sensitive data
        console.log(`[BOOTSTRAP] Admin invite created for org ${orgId}`);

        return NextResponse.json({
            ok: true,
            code: 'INVITE_CREATED',
            inviteToken,
            expiresIn: '7 days',
            request_id: requestId,
        });

    } catch (error: any) {
        console.error('[BOOTSTRAP] Error:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

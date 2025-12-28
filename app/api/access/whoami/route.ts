/**
 * WHOAMI API — Get Current User Info
 * 
 * GET /api/access/whoami
 * Returns authenticated user's info and memberships.
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/access/guards';
import { getMembershipsForUser } from '@/lib/access/tenancy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const requestId = crypto.randomUUID();

    try {
        const authResult = await getAuthenticatedUser(req);
        if (!authResult.ok) {
            return authResult.response;
        }

        const { userId } = authResult.value;

        // Get all memberships
        const memberships = await getMembershipsForUser(userId);

        // Get primary membership (first one, or highest role)
        const primary = memberships.length > 0 ? memberships[0] : null;

        return NextResponse.json({
            userId,
            orgId: primary?.orgId ?? null,
            teamId: primary?.teamId ?? null,
            role: primary?.role ?? null,
            memberships: memberships.map(m => ({
                orgId: m.orgId,
                teamId: m.teamId,
                role: m.role,
            })),
            request_id: requestId,
        });

    } catch (error: any) {
        console.error('[API] /access/whoami failed:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error', code: 'INTERNAL_ERROR', request_id: requestId },
            { status: 500 }
        );
    }
}

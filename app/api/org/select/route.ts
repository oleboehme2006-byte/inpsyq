/**
 * ORG SELECT API — Select an organization
 * 
 * POST /api/org/select
 * Body: { orgId: string }
 * 
 * Sets the selected org cookie and returns redirect path.
 */

import { NextResponse } from 'next/server';
import { getSelectedOrgCookieName, getRedirectForRole } from '@/lib/auth/context';
import { getMembershipsForUser, getMembershipForOrg } from '@/lib/access/tenancy';
import { getAuthenticatedUser } from '@/lib/access/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    // Authenticate user
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.ok) {
        return NextResponse.json(
            { ok: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
            { status: 401 }
        );
    }

    const { userId } = authResult.value;

    try {
        const body = await req.json();
        const { orgId } = body;

        if (!orgId || typeof orgId !== 'string') {
            return NextResponse.json(
                { ok: false, error: { code: 'VALIDATION_ERROR', message: 'orgId is required' } },
                { status: 400 }
            );
        }

        // Verify user has access to this org
        const membership = await getMembershipForOrg(userId, orgId);
        if (!membership) {
            return NextResponse.json(
                { ok: false, error: { code: 'FORBIDDEN', message: 'No access to this organization' } },
                { status: 403 }
            );
        }

        // Determine redirect based on role
        const redirectTo = getRedirectForRole(membership.role, membership.teamId);

        // Set selected org cookie
        const isProd = process.env.NODE_ENV === 'production';
        const cookieValue = `${getSelectedOrgCookieName()}=${orgId}; Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}; Max-Age=${30 * 24 * 60 * 60}`;

        return NextResponse.json(
            { ok: true, redirectTo },
            { headers: { 'Set-Cookie': cookieValue } }
        );

    } catch (error: any) {
        console.error('[API] /org/select failed:', error.message);
        return NextResponse.json(
            { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}

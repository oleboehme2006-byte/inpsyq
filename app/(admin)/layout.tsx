/**
 * ADMIN LAYOUT — Server-side ADMIN-only gate + Shell wrapper
 * 
 * All pages under /admin/* require ADMIN role.
 * Non-admin users are redirected to their role's home page.
 */

import { redirect } from 'next/navigation';
import { resolveAuthContext, getRedirectForRole } from '@/lib/auth/context';
import AdminShell from '@/components/admin/AdminShell';
import { query } from '@/db/client';

async function getOrgName(orgId: string): Promise<string | undefined> {
    try {
        const result = await query('SELECT name FROM orgs WHERE org_id = $1', [orgId]);
        return result.rows[0]?.name;
    } catch {
        return undefined;
    }
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const authResult = await resolveAuthContext();

    // Not authenticated -> login
    if (!authResult.authenticated) {
        redirect('/login');
    }

    // No org selected -> org select
    if (!authResult.context) {
        if (authResult.error === 'NO_ORG_SELECTED') {
            redirect('/org/select');
        }
        redirect('/login');
    }

    // Not ADMIN -> redirect to role home
    if (authResult.context.role !== 'ADMIN') {
        const roleHome = getRedirectForRole(authResult.context.role, authResult.context.teamId);
        redirect(roleHome);
    }

    // Fetch org name for display
    const orgName = await getOrgName(authResult.context.orgId);

    // ADMIN -> render admin shell with content
    return (
        <div data-testid="admin-home">
            <AdminShell orgName={orgName}>
                {children}
            </AdminShell>
        </div>
    );
}

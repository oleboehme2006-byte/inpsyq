/**
 * ADMIN LAYOUT — Server-side ADMIN-only gate + Shell wrapper
 * 
 * All pages under /admin/* require ADMIN role.
 * Non-admin users are redirected to their role's home page.
 */

import AdminShell from '@/components/admin/AdminShell';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    if (DEMO_MODE) {
        return (
            <AdminShell orgName="Demo Organization">
                {children}
            </AdminShell>
        );
    }

    // Production with auth
    const { redirect } = await import('next/navigation');
    const { resolveAuthContext, getRedirectForRole } = await import('@/lib/auth/context');
    const { query } = await import('@/db/client');

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
        return null; // TS flow analysis helper
    }

    // Not ADMIN -> redirect to role home
    if (authResult.context.role !== 'ADMIN') {
        const roleHome = getRedirectForRole(authResult.context.role, authResult.context.teamId);
        redirect(roleHome);
    }

    // Fetch org name for display
    let orgName: string | undefined;
    try {
        const result = await query('SELECT name FROM orgs WHERE org_id = $1', [authResult.context.orgId]);
        orgName = result.rows[0]?.name;
    } catch {
        // silently fail
    }

    return (
        <AdminShell orgName={orgName}>
            {children}
        </AdminShell>
    );
}


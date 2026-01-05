/**
 * ADMIN LAYOUT — Server-side ADMIN-only gate
 * 
 * All pages under /admin/* require ADMIN role.
 * Non-admin users are redirected to their role's home page.
 */

import { redirect } from 'next/navigation';
import { resolveAuthContext, getRedirectForRole } from '@/lib/auth/context';

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

    // ADMIN -> render admin content
    return (
        <div data-testid="admin-home">
            {children}
        </div>
    );
}

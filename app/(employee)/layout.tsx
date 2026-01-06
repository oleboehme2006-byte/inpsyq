/**
 * Employee Layout
 * 
 * Server-side gate for EMPLOYEE role access.
 * Ensures only EMPLOYEE users can access /employee/* pages.
 */

import { resolveAuthContext, getRedirectForRole } from '@/lib/auth/context';
import { redirect } from 'next/navigation';

export default async function EmployeeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const result = await resolveAuthContext();

    // If not authenticated, redirect based on error
    if (!result.authenticated) {
        redirect(result.redirectTo || '/login');
    }

    // If no context (e.g., no org selected), redirect
    if (!result.context) {
        redirect(result.redirectTo || '/org/select');
    }

    const { role, teamId } = result.context;

    // EMPLOYEE only - other roles go to their own pages
    if (role !== 'EMPLOYEE') {
        redirect(getRedirectForRole(role, teamId));
    }

    return <>{children}</>;
}

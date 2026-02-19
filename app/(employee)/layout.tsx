/**
 * Employee Layout
 * 
 * Server-side gate for EMPLOYEE role access.
 * Ensures only EMPLOYEE users can access /employee/* pages.
 */

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const DEV_MODE = process.env.NODE_ENV === 'development';

export default async function EmployeeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Bypass role check in demo mode and dev mode (for testing)
    if (DEMO_MODE || DEV_MODE) {
        return <>{children}</>;
    }

    const { resolveAuthContext, getRedirectForRole } = await import('@/lib/auth/context');
    const { redirect } = await import('next/navigation');

    const result = await resolveAuthContext();

    // If not authenticated, redirect based on error
    if (!result.authenticated) {
        redirect(result.redirectTo || '/login');
    }

    // If no context (e.g., no org selected), redirect
    if (!result.context) {
        return redirect(result.redirectTo || '/org/select');
    }

    const { role, teamId } = result.context;

    // EMPLOYEE only - other roles go to their own pages
    if (role !== 'EMPLOYEE') {
        redirect(getRedirectForRole(role, teamId));
    }

    return <>{children}</>;
}


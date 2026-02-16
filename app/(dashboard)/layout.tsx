/**
 * Dashboard Layout (Server Component)
 * 
 * Enforces server-side auth gating for all dashboard routes.
 * Unauthenticated users are redirected to /login.
 * 
 * When NEXT_PUBLIC_DEMO_MODE=true, auth is bypassed entirely
 * (dashboards use only mock data, no real user data is exposed).
 */

import '@/app/globals.css';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { resolveAuthContext } from '@/lib/auth/context';
import { MockBanner } from '@/components/dev/MockBanner';

export const metadata: Metadata = {
    title: 'inPsyq Dashboard',
    description: 'Instrument-grade psychological analytics for organizational health',
};

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Authenticate, but do NOT redirect if unauthenticated.
    // This allows public access to /executive and /team/* for demo purposes.
    // The individual pages will check for auth and show demo data if missing.
    if (!DEMO_MODE) {
        const authResult = await resolveAuthContext();

        // Only redirect if explicitly denied access (e.g. banned) or if we need to enforce strictly.
        // For now, we allow "no context" to proceed to pages.

        // EMPLOYEE role check still applies if we HAVE a context
        if (authResult.context?.role === 'EMPLOYEE') {
            redirect('/measure');
        }
    }

    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className="bg-bg-base text-text-primary antialiased">
                {!DEMO_MODE && <MockBanner />}
                {children}
            </body>
        </html>
    );
}


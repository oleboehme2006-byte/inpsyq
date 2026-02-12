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
    // In demo mode, skip auth entirely — dashboards use only mock data
    if (!DEMO_MODE) {
        // Server-side auth gate
        const authResult = await resolveAuthContext();

        // Redirect if not authenticated or missing org
        if (!authResult.authenticated || !authResult.context) {
            redirect(authResult.redirectTo || '/login');
        }

        // EMPLOYEE should go to /measure
        if (authResult.context.role === 'EMPLOYEE') {
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


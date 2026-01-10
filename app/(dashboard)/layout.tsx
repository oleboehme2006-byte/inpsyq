/**
 * Dashboard Layout (Server Component)
 * 
 * Enforces server-side auth gating for all dashboard routes.
 * Unauthenticated users are redirected to /login.
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

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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

    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className="bg-bg-base text-text-primary antialiased">
                <MockBanner />
                {children}
            </body>
        </html>
    );
}

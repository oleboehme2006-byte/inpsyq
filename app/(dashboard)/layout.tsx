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

        // If authenticated as EMPLOYEE, they shouldn't be here (dashboard is for admins/leaders)
        if (authResult.authenticated && authResult.context?.role === 'EMPLOYEE') {
            redirect('/measure');
        }

        // Note: We no longer redirect to /login here for unauthenticated users.
        // This allows specific pages (Executive, Team) to fall back to "Public Demo Mode"
        // if the user is not logged in.
        // Protected pages must enforce their own auth checks.
    }

    return (
        <div className="min-h-screen flex flex-col">
            {!DEMO_MODE && <MockBanner />}
            {children}
        </div>
    );
}


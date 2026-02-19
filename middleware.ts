/**
 * MIDDLEWARE — Clerk Auth + Route Protection
 * 
 * Phase 11 Item 1.1: Post-login redirect for authenticated users.
 * 
 * - Public routes: /, /login, /sign-up, /invite/*, /api/webhooks/*
 * - Dashboard routes: require authentication
 * - Authenticated users on / → redirect to /api/auth/redirect
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Skip auth entirely in demo mode
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
    '/',
    '/login(.*)',
    '/sign-up(.*)',
    '/sign-in(.*)',
    '/invite/(.*)',
    '/api/webhooks/(.*)',
    '/api/cron/(.*)',
    '/api/health',
]);

export default clerkMiddleware(async (auth, req) => {
    // Demo mode: skip all auth
    if (DEMO_MODE) {
        return NextResponse.next();
    }

    const { userId } = await auth();

    // Authenticated user on landing page → redirect to dashboard
    if (userId && req.nextUrl.pathname === '/') {
        const redirectUrl = new URL('/api/auth/redirect', req.url);
        return NextResponse.redirect(redirectUrl);
    }

    // Public route → allow through
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }

    // Protected route → require auth
    if (!userId) {
        const loginUrl = new URL('/login', req.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Match all routes except static files and Next.js internals
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};

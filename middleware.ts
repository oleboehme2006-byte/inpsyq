import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Development Middleware
 * 
 * Automatically sets authentication cookies in development mode to ensure
 * seamless access to dashboards without manual login or database setups.
 */
export function middleware(request: NextRequest) {
    // ONLY RUN IN DEVELOPMENT
    if (process.env.NODE_ENV === 'development') {
        const devUser = request.cookies.get('inpsyq_dev_user');
        const selectedOrg = request.cookies.get('inpsyq_selected_org');
        const url = request.nextUrl;

        // Skip if already has cookies or is a Next.js internal request
        if ((devUser && selectedOrg) ||
            url.pathname.startsWith('/_next') ||
            url.pathname.startsWith('/api') ||
            url.pathname.includes('.')) {
            return NextResponse.next();
        }

        // Redirect to the same URL but with cookies set
        const response = NextResponse.redirect(request.url);

        // Set valid seed user UUID (Executive/TeamLead)
        if (!devUser) {
            response.cookies.set('inpsyq_dev_user', '33333333-3333-4333-8333-000000000001', {
                path: '/',
                sameSite: 'lax',
                secure: false
            });
        }

        // Set valid seed org UUID
        if (!selectedOrg) {
            response.cookies.set('inpsyq_selected_org', '11111111-1111-4111-8111-111111111111', {
                path: '/',
                sameSite: 'lax',
                secure: false
            });
        }

        console.log(`[Middleware] Dev Mode: Auto-injected auth cookies for ${url.pathname}`);
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};

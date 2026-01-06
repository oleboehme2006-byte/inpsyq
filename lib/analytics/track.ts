/**
 * Optional Analytics
 * 
 * Tracks events via Plausible if NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set.
 * Does nothing if not configured.
 */

export function trackEvent(eventName: string, props?: Record<string, string | number | boolean>) {
    // Only track if Plausible domain is configured
    const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    if (!domain) return;

    // Only track in browser
    if (typeof window === 'undefined') return;

    // Use Plausible's API if available
    const plausible = (window as any).plausible;
    if (typeof plausible === 'function') {
        plausible(eventName, { props });
        return;
    }

    // Fallback: POST to Plausible API
    try {
        fetch('https://plausible.io/api/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                domain,
                name: eventName,
                url: window.location.href,
                props,
            }),
        }).catch(() => {
            // Silently fail
        });
    } catch {
        // Silently fail
    }
}

// Convenience methods
export const analytics = {
    landingView: () => trackEvent('landing_view'),
    clickRequestAccess: () => trackEvent('click_request_access'),
    clickViewDemo: () => trackEvent('click_view_demo'),
    demoView: () => trackEvent('demo_view'),
};

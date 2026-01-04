/**
 * PLAUSIBLE — Analytics Integration
 * 
 * Minimal helper for tracking events. Only active in production
 * when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set.
 */

type PlausibleEventData = Record<string, string | number | boolean>;

declare global {
    interface Window {
        plausible?: (event: string, options?: { props?: PlausibleEventData }) => void;
    }
}

/**
 * Track an event to Plausible.
 * No-op if Plausible is not available.
 */
export function trackEvent(event: string, props?: PlausibleEventData): void {
    if (typeof window !== 'undefined' && window.plausible) {
        window.plausible(event, props ? { props } : undefined);
    }
}

/**
 * Check if Plausible is enabled.
 */
export function isPlausibleEnabled(): boolean {
    return !!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
}

/**
 * Get the Plausible domain.
 */
export function getPlausibleDomain(): string | undefined {
    return process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
}

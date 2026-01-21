/**
 * COOKIE JAR HELPER
 * 
 * Provides robust cookie parsing and management for verification scripts.
 * Handles multiple Set-Cookie headers, complex attributes, and merging.
 */

/**
 * Extract cookies from a fetch Response object.
 * accounts for Node.js fetch which may return split or combined headers.
 */
export function extractCookiesFromResponse(res: Response): string[] {
    const setCookieHeader = res.headers.get('set-cookie');
    if (!setCookieHeader) return [];

    // Check if the environment provides raw headers (some fetch polyfills do)
    // If we only have the comma-joined string, we must parse it carefully.

    // Regex matches ", " followed by a cookie name (token) and equals sign, 
    // ensuring we don't split on commas inside dates (Expires=Wed, 21 Oct...)
    const cookies: string[] = [];

    // If it's an array already (e.g. node-fetch raw), use it. 
    // Standard Fetch API returns a combined string.
    const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

    for (const header of headers) {
        // Split logic: look for comma followed by non-whitespace, non-semicolon, equals
        const parts = header.split(/,\s*(?=[^;=\s]+=[^;]+)/);
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed) cookies.push(trimmed);
        }
    }

    return cookies;
}

/**
 * Merge new Set-Cookie values into an existing list of "Name=Value" strings.
 * Overwrites existing cookies by name.
 */
export function mergeCookies(existing: string[], newCookies: string[]): string[] {
    const cookieMap = new Map<string, string>();

    // Load existing
    for (const c of existing) {
        const match = c.match(/^([^;=\s]+)=([^;]*)/);
        if (match) {
            cookieMap.set(match[1], match[2]);
        }
    }

    // Merge new (Set-Cookie strings might have attributes, strip them for the jar)
    for (const c of newCookies) {
        const match = c.match(/^([^;=\s]+)=([^;]*)/);
        if (match) {
            cookieMap.set(match[1], match[2]);
        }
    }

    const result: string[] = [];
    for (const [name, value] of cookieMap.entries()) {
        result.push(`${name}=${value}`);
    }
    return result;
}

/**
 * Convert cookie array to Cookie header string.
 */
export function toCookieHeader(cookies: string[]): string {
    return cookies.join('; ');
}

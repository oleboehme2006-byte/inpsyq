/**
 * Verification Base URL Helper
 * 
 * Provides consistent base URL resolution and JSON response assertion
 * for all verification scripts.
 */

/**
 * Get the base URL for verification scripts.
 * Priority: VERIFY_BASE_URL > NEXT_PUBLIC_BASE_URL > http://localhost:3000
 */
export function getVerifyBaseUrl(): string {
    return (
        process.env.VERIFY_BASE_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        'http://localhost:3000'
    );
}

/**
 * Assert that a response is valid JSON, not HTML error page.
 * Throws with detailed debugging info if not JSON.
 */
export function assertJsonResponse(
    res: Response,
    bodyText: string,
    context: string
): void {
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const looksLikeHtml = bodyText.trimStart().startsWith('<!DOCTYPE') ||
        bodyText.trimStart().startsWith('<html');

    if (!isJson || looksLikeHtml) {
        const preview = bodyText.substring(0, 200);
        throw new Error(
            `[${context}] Expected JSON response but got HTML or non-JSON:\n` +
            `  URL: ${res.url}\n` +
            `  Status: ${res.status}\n` +
            `  Content-Type: ${contentType}\n` +
            `  Body preview: ${preview}...`
        );
    }
}

/**
 * Safe fetch that validates JSON response.
 * Returns parsed JSON or throws with debugging info.
 */
export async function fetchJson<T = any>(
    url: string,
    options: RequestInit,
    context: string
): Promise<{ status: number; json: T; bodyText: string }> {
    const res = await fetch(url, options);
    const bodyText = await res.text();

    // Don't assert JSON for expected error cases (401, 405)
    // but do check we're not getting HTML for those either
    if (res.status !== 401 && res.status !== 405) {
        assertJsonResponse(res, bodyText, context);
    } else if (bodyText.trimStart().startsWith('<!DOCTYPE') ||
        bodyText.trimStart().startsWith('<html')) {
        throw new Error(
            `[${context}] Got HTML error page instead of API response:\n` +
            `  URL: ${url}\n` +
            `  Status: ${res.status}\n` +
            `  Body preview: ${bodyText.substring(0, 200)}...`
        );
    }

    let json: T = {} as T;
    try {
        json = JSON.parse(bodyText);
    } catch {
        // For non-JSON responses (like 401/405), this is OK
        if (res.ok) {
            throw new Error(
                `[${context}] Failed to parse JSON:\n` +
                `  URL: ${url}\n` +
                `  Status: ${res.status}\n` +
                `  Body: ${bodyText.substring(0, 200)}...`
            );
        }
    }

    return { status: res.status, json, bodyText };
}

/**
 * Mask secrets in headers for logging.
 */
export function maskHeaders(headers: Record<string, string>): Record<string, string> {
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('auth')) {
            masked[key] = value ? `${value.substring(0, 4)}...` : '(empty)';
        } else {
            masked[key] = value;
        }
    }
    return masked;
}

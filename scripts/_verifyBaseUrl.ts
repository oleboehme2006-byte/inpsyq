/**
 * Single Source of Truth for Base URL
 * Used by verification scripts to ensure consistency (Port 3001).
 */
export const BASE_URL = process.env.VERIFY_BASE_URL || 'http://localhost:3001';

export function logBaseUrl() {
    console.log(`Using Base URL: ${BASE_URL}`);
    if (BASE_URL.includes(':3000')) {
        console.warn('\x1b[33mWARNING: Port 3000 detected. Canonical port is 3001.\x1b[0m');
    }
}

export function getVerifyBaseUrl() {
    return BASE_URL;
}

export type FetchResult = {
    status: number;
    json: any;
    bodyText: string;
    ok: boolean;
};

export async function fetchJson(
    url: string,
    options: RequestInit,
    context: string
): Promise<FetchResult> {
    try {
        const res = await fetch(url, options);
        const bodyText = await res.text();
        let json = null;
        try {
            json = JSON.parse(bodyText);
        } catch (e) {
            // ignore JSON parse error on non-JSON response
        }
        return {
            status: res.status,
            json,
            bodyText,
            ok: res.ok
        };
    } catch (e: any) {
        throw new Error(`[${context}] Fetch failed: ${e.message}`);
    }
}

export function maskHeaders(headers: any) {
    const masked = { ...headers };
    if (masked['x-inpsyq-admin-secret']) masked['x-inpsyq-admin-secret'] = '***';
    if (masked['x-cron-secret']) masked['x-cron-secret'] = '***';
    return masked;
}

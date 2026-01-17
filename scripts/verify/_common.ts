/**
 * Common Utilities for Verification Scripts
 *
 * Shared helpers for HTTP requests, assertions, and reporting.
 */

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
export const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;

export interface TestResult {
    name: string;
    passed: boolean;
    details?: any;
    error?: string;
}

const results: TestResult[] = [];

/**
 * Run a test and record the result.
 */
export async function test(name: string, fn: () => Promise<void>): Promise<void> {
    try {
        await fn();
        results.push({ name, passed: true });
        console.log(`  ✅ ${name}`);
    } catch (e: any) {
        results.push({ name, passed: false, error: e.message });
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

/**
 * Assert a condition is true.
 */
export function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

/**
 * Assert two values are equal.
 */
export function assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

/**
 * Fetch with admin auth header.
 */
export async function fetchWithAuth(path: string, options: RequestInit = {}): Promise<Response> {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${ADMIN_SECRET}`,
        },
    });
}

/**
 * Print summary and exit with appropriate code.
 */
export function summarize(): void {
    console.log('\n' + '═'.repeat(60));
    console.log('SUMMARY');
    console.log('═'.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    for (const r of results) {
        console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
    }

    console.log(`\nTotal: ${passed}/${results.length} passed`);

    if (failed > 0) {
        console.log('\n❌ VERIFICATION FAILED');
        process.exit(1);
    } else {
        console.log('\n✅ VERIFICATION PASSED');
    }
}

/**
 * Clear results (for re-running).
 */
export function clearResults(): void {
    results.length = 0;
}

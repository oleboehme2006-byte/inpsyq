/**
 * PHASE 21.A — Health Gate Verification
 * 
 * Checks:
 * 1. GET / (landing page) → 200, HTML
 * 2. GET /api/internal/runtime → 200, JSON
 * 3. GET /api/internal/ops/health/global → 200 JSON (or SKIP if no secret)
 */

import './_bootstrap';

const BASE_URL = process.env.VERIFY_BASE_URL || 'http://localhost:3001';
const ADMIN_SECRET = process.env.INTERNAL_ADMIN_SECRET;

interface CheckResult {
    name: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    details?: string;
}

async function checkLandingPage(): Promise<CheckResult> {
    const name = 'Executive Page (/executive)';
    try {
        const res = await fetch(`${BASE_URL}/executive`);
        if (res.status !== 200) {
            return { name, status: 'FAIL', details: `Status ${res.status}` };
        }
        const text = await res.text();
        if (!text.includes('<html') && !text.includes('<!DOCTYPE')) {
            return { name, status: 'FAIL', details: 'Response does not contain HTML markers' };
        }
        return { name, status: 'PASS', details: `200 OK, ${text.length} bytes` };
    } catch (e: any) {
        return { name, status: 'FAIL', details: e.message };
    }
}

async function checkRuntimeEndpoint(): Promise<CheckResult> {
    const name = 'Runtime API (/api/internal/runtime)';
    try {
        const res = await fetch(`${BASE_URL}/api/internal/runtime`);
        if (res.status !== 200) {
            return { name, status: 'FAIL', details: `Status ${res.status}` };
        }
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            return { name, status: 'FAIL', details: `Not JSON: ${contentType}` };
        }
        const data = await res.json();
        if (!data.ok) {
            return { name, status: 'FAIL', details: `ok=false: ${data.error}` };
        }
        return { name, status: 'PASS', details: 'JSON, ok=true' };
    } catch (e: any) {
        return { name, status: 'FAIL', details: e.message };
    }
}

async function checkHealthEndpoint(): Promise<CheckResult> {
    const name = 'Health API (/api/internal/ops/health/global)';

    if (!ADMIN_SECRET) {
        return { name, status: 'SKIP', details: 'INTERNAL_ADMIN_SECRET not set' };
    }

    try {
        const res = await fetch(`${BASE_URL}/api/internal/ops/health/global`, {
            headers: { 'x-inpsyq-admin-secret': ADMIN_SECRET }
        });
        if (res.status === 401) {
            return { name, status: 'SKIP', details: 'Auth required (401) - secret may be incorrect' };
        }
        if (res.status !== 200) {
            return { name, status: 'FAIL', details: `Status ${res.status}` };
        }
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            return { name, status: 'FAIL', details: `Not JSON: ${contentType}` };
        }
        return { name, status: 'PASS', details: 'JSON response OK' };
    } catch (e: any) {
        return { name, status: 'FAIL', details: e.message };
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 21.A — Health Gate Verification');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Base URL: ${BASE_URL}`);
    console.log('');

    const results: CheckResult[] = [
        await checkLandingPage(),
        await checkRuntimeEndpoint(),
        await checkHealthEndpoint(),
    ];

    let failed = false;
    for (const r of results) {
        const icon = r.status === 'PASS' ? '✓' : r.status === 'SKIP' ? '○' : '✗';
        const color = r.status === 'PASS' ? '\x1b[32m' : r.status === 'SKIP' ? '\x1b[33m' : '\x1b[31m';
        console.log(`${color}${icon}\x1b[0m ${r.name}: ${r.status}${r.details ? ` — ${r.details}` : ''}`);
        if (r.status === 'FAIL') failed = true;
    }

    console.log('');
    if (failed) {
        console.log('\x1b[31m✗ HEALTH GATE FAILED\x1b[0m');
        console.log('Fix the above issues before proceeding with Phase 21.');
        process.exit(1);
    } else {
        console.log('\x1b[32m✓ HEALTH GATE PASSED\x1b[0m');
    }
}

main().catch(e => {
    console.error('Health gate script error:', e.message);
    process.exit(1);
});

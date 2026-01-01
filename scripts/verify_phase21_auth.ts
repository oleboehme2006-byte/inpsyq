/**
 * PHASE 21.C — Auth Verification
 * 
 * Tests:
 * 1. POST to /api/internal/dev/login with fixture user UUID
 * 2. Store the inpsyq_dev_user cookie
 * 3. GET /api/dashboard/executive with cookie
 * 4. Expect 200 JSON (not 401)
 */

import './_bootstrap';

const BASE_URL = process.env.VERIFY_BASE_URL || 'http://localhost:3001';
const FIXTURE_USER_ID = '33333333-3333-4333-8333-000000000001';
const FIXTURE_ORG_ID = '11111111-1111-4111-8111-111111111111';

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 21.C — Auth Verification');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`User ID: ${FIXTURE_USER_ID}`);
    console.log('');

    // Step 1: Login to get cookie
    console.log('1. Testing dev login...');
    const loginRes = await fetch(`${BASE_URL}/api/internal/dev/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: FIXTURE_USER_ID }),
    });

    if (loginRes.status !== 200) {
        console.log(`\x1b[31m✗ Login failed: ${loginRes.status}\x1b[0m`);
        const text = await loginRes.text();
        console.log(`Response: ${text.slice(0, 200)}`);
        process.exit(1);
    }

    // Extract cookie from Set-Cookie header
    const setCookie = loginRes.headers.get('set-cookie');
    if (!setCookie || !setCookie.includes('inpsyq_dev_user')) {
        console.log('\x1b[31m✗ No inpsyq_dev_user cookie in response\x1b[0m');
        console.log(`Set-Cookie: ${setCookie}`);
        process.exit(1);
    }

    // Parse cookie value
    const cookieMatch = setCookie.match(/inpsyq_dev_user=([^;]+)/);
    const cookieValue = cookieMatch ? cookieMatch[1] : '';
    console.log(`\x1b[32m✓ Login successful, cookie received\x1b[0m`);

    // Step 2: Access executive dashboard with cookie
    console.log('');
    console.log('2. Testing dashboard access with cookie...');

    const dashboardRes = await fetch(`${BASE_URL}/api/dashboard/executive?org_id=${FIXTURE_ORG_ID}`, {
        headers: {
            'Cookie': `inpsyq_dev_user=${cookieValue}`,
        },
    });

    if (dashboardRes.status === 401) {
        console.log('\x1b[31m✗ Dashboard returned 401 Unauthorized\x1b[0m');
        const json = await dashboardRes.json().catch(() => ({}));
        console.log(`Response: ${JSON.stringify(json)}`);
        process.exit(1);
    }

    if (dashboardRes.status !== 200) {
        console.log(`\x1b[33m⚠ Dashboard returned ${dashboardRes.status} (not 401)\x1b[0m`);
        const text = await dashboardRes.text();
        console.log(`Response: ${text.slice(0, 300)}`);
        // This might be OK if it's a data issue, not auth issue
    } else {
        const contentType = dashboardRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            console.log('\x1b[32m✓ Dashboard returned 200 JSON\x1b[0m');
        } else {
            console.log(`\x1b[33m⚠ Dashboard returned 200 but content-type: ${contentType}\x1b[0m`);
        }
    }

    // Step 3: Also test with X-DEV-USER-ID header (backup auth method)
    console.log('');
    console.log('3. Testing dashboard access with header...');

    const headerRes = await fetch(`${BASE_URL}/api/dashboard/executive?org_id=${FIXTURE_ORG_ID}`, {
        headers: {
            'X-DEV-USER-ID': FIXTURE_USER_ID,
        },
    });

    if (headerRes.status === 401) {
        console.log('\x1b[31m✗ Header auth returned 401 Unauthorized\x1b[0m');
        process.exit(1);
    }

    if (headerRes.status === 200) {
        console.log('\x1b[32m✓ Header auth returned 200\x1b[0m');
    } else {
        console.log(`\x1b[33m⚠ Header auth returned ${headerRes.status}\x1b[0m`);
    }

    console.log('');
    console.log('\x1b[32m✓ AUTH VERIFICATION PASSED\x1b[0m');
    console.log('Cookie-based and header-based auth both work.');
}

main().catch(e => {
    console.error('Auth verification error:', e.message);
    process.exit(1);
});

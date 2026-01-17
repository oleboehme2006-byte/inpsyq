/**
 * Verify Phase 20.1: API Authentication
 * 
 * Verifies that:
 * 1. Dev login endpoint issues a cookie.
 * 2. Protected API accepts the cookie in dev mode.
 * 3. Protected API still accepts header (legacy dev).
 */

import './_bootstrap';
import { getVerifyBaseUrl } from './_verifyBaseUrl';

const BASE_URL = getVerifyBaseUrl();
// Fixture IDs from lib/dev/fixtures.ts or known constants
const TEAM_ID = '22222222-2222-4222-8222-222222222201'; // Engineering
const ORG_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '33333333-3333-4333-8333-000000000001'; // User 1 (Engineering)

async function verifyApi() {
    console.log('=== Verifying Phase 20.1 API Auth ===\n');
    console.log(`Base URL: ${BASE_URL}\n`);

    // 1. Login to get Cookie
    console.log('1. Authenticating via /api/internal/dev/login...');
    const loginRes = await fetch(`${BASE_URL}/api/internal/dev/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID })
    });

    if (!loginRes.ok) {
        throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
    }

    const cookieHeader = loginRes.headers.get('set-cookie');
    if (!cookieHeader || !cookieHeader.includes('inpsyq_dev_user=')) {
        throw new Error('Login response missing inpsyq_dev_user cookie');
    }
    console.log('✓ Login successful, cookie received');

    // Extract cookie
    const cookieValue = cookieHeader.split(';')[0]; // simple extraction

    // 2. Access Protected API with Cookie
    console.log('\n2. Testing Protected API with Cookie...');
    const dashRes = await fetch(`${BASE_URL}/api/dashboard/team?org_id=${ORG_ID}&team_id=${TEAM_ID}`, {
        headers: {
            'Cookie': cookieValue
            // NO x-dev-user-id header
        }
    });

    if (dashRes.status === 200) {
        console.log('✓ API accepted cookie auth');
    } else {
        const text = await dashRes.text();
        throw new Error(`API rejected cookie auth: ${dashRes.status} ${text}`);
    }

    // 3. Access Protected API with Header (Regression Check)
    console.log('\n3. Testing Protected API with Header...');
    const headerRes = await fetch(`${BASE_URL}/api/dashboard/team?org_id=${ORG_ID}&team_id=${TEAM_ID}`, {
        headers: {
            'x-dev-user-id': USER_ID
        }
    });

    if (headerRes.status === 200) {
        console.log('✓ API accepted header auth');
    } else {
        throw new Error(`API rejected header auth: ${headerRes.status}`);
    }

    console.log('\n✅ Phase 20.1 API Verification Passed');
}

verifyApi().catch(e => {
    console.error(e);
    process.exit(1);
});

/**
 * verify_phase21_2_api_trace.ts
 * 
 * Objectives:
 * 1. Simulate a client-side fetch (with Cookie) to /api/dashboard/executive.
 * 2. Trace request headers and response headers/body.
 * 3. Verify NO "Data Unavailable" and 200 OK.
 * 4. Verify user identity is correctly resolved from cookie.
 */

import { chromium } from 'playwright';

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;
const USER_ID = '33333333-3333-4333-8333-000000000001';
const ORG_ID = '11111111-1111-4111-8111-111111111111';
const TEAM_ENG_ID = '22222222-2222-4222-8222-222222222201';

async function main() {
    console.log('--- API TRACE: Executive Dashboard ---');
    const browser = await chromium.launch();
    const context = await browser.newContext();

    // 1. Set Cookie manually ( simulating login without visiting page first, for pure API test)
    // Or better: hit the login endpoint first to be authentic.
    const page = await context.newPage();

    // Auth Step
    console.log(`> POST /api/internal/dev/login { user_id: ${USER_ID} }`);
    const loginRes = await page.request.post(`${BASE_URL}/api/internal/dev/login`, {
        data: { user_id: USER_ID }
    });
    console.log(`< Login Status: ${loginRes.status()}`);

    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name === 'inpsyq_dev_user');
    if (!authCookie) {
        console.error('CRITICAL: Auth cookie not set after login.');
        process.exit(1);
    }
    console.log(`> Cookie set: ${authCookie.name}=${authCookie.value.substring(0, 10)}...`);

    // Trace API Call (Executive Dashboard)
    console.log(`\n> GET /api/dashboard/executive?org_id=${ORG_ID}`);
    const apiRes = await page.request.get(`${BASE_URL}/api/dashboard/executive`, {
        params: { org_id: ORG_ID },
        // Playwright request context auto-sends cookies from context
    });

    console.log(`< Status: ${apiRes.status()}`);
    console.log(`< Headers:`, apiRes.headers());

    const body = await apiRes.text();
    console.log(`< Body Priority Preview: ${body.substring(0, 200)}...`);

    if (apiRes.status() !== 200) {
        console.error('FAILURE: Status not 200');
        process.exit(1);
    }

    if (body.includes('Data Unavailable')) {
        console.error('FAILURE: Body contains "Data Unavailable"');
        process.exit(1);
    }

    // Trace API Call (Interpretation) - THE SUSPECT
    console.log(`\n> GET /api/interpretation/executive?org_id=${ORG_ID}`);
    const interpRes = await page.request.get(`${BASE_URL}/api/interpretation/executive`, {
        params: { org_id: ORG_ID },
    });
    console.log(`< Status: ${interpRes.status()}`);
    const interpBody = await interpRes.text();
    console.log(`< Body: ${interpBody}`); // This will reveal the 500 error detail

    if (interpRes.status() !== 200) {
        console.error('FAILURE: Interpretation API failed');
        // Do not exit, keep debugging
    }
    // Trace Team Page
    console.log(`\n> GET /team/${TEAM_ENG_ID}?demo=true`);
    const teamRes = await page.request.get(`${BASE_URL}/team/${TEAM_ENG_ID}?demo=true`);
    console.log(`< Status: ${teamRes.status()}`);
    if (teamRes.status() !== 200) {
        console.error('FAILURE: Team Page failed');
        const teamBody = await teamRes.text();
        console.log(`< Body: ${teamBody.substring(0, 500)}`);
    }

    console.log('\nSUCCESS: API accessible via Cookie.');
    await browser.close();
}


main().catch(e => {
    console.error(e);
    process.exit(1);
});

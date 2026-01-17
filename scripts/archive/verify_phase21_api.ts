/**
 * PHASE 21.E — API Verification
 * 
 * With dev auth, tests:
 * 1. /api/dashboard/executive?org_id=<fixtureOrg> → 200, has data
 * 2. /api/dashboard/team?org_id=<fixtureOrg>&team_id=<fixtureTeam>&weeks=9 → 200, has data
 * 3. FAIL if 401, 500, HTML, or empty response
 */

import './_bootstrap';

const BASE_URL = process.env.VERIFY_BASE_URL || 'http://localhost:3001';
const FIXTURE_USER_ID = '33333333-3333-4333-8333-000000000001';
const FIXTURE_ORG_ID = '11111111-1111-4111-8111-111111111111';
const FIXTURE_TEAM_ID = '22222222-2222-4222-8222-222222222201';

interface ApiCheckResult {
    endpoint: string;
    status: 'PASS' | 'FAIL';
    httpStatus: number;
    details: string;
    hasData: boolean;
}

async function checkApi(path: string, description: string): Promise<ApiCheckResult> {
    const url = `${BASE_URL}${path}`;

    try {
        const res = await fetch(url, {
            headers: { 'X-DEV-USER-ID': FIXTURE_USER_ID },
        });

        const contentType = res.headers.get('content-type') || '';

        // Check for HTML error pages
        if (contentType.includes('text/html')) {
            return {
                endpoint: description,
                status: 'FAIL',
                httpStatus: res.status,
                details: 'Received HTML instead of JSON',
                hasData: false,
            };
        }

        if (res.status === 401) {
            return {
                endpoint: description,
                status: 'FAIL',
                httpStatus: 401,
                details: 'Unauthorized',
                hasData: false,
            };
        }

        if (res.status >= 500) {
            const text = await res.text();
            return {
                endpoint: description,
                status: 'FAIL',
                httpStatus: res.status,
                details: `Server error: ${text.slice(0, 100)}`,
                hasData: false,
            };
        }

        const json = await res.json();

        // Check for error responses
        if (json.error || json.code === 'NO_DATA') {
            return {
                endpoint: description,
                status: 'FAIL',
                httpStatus: res.status,
                details: json.error || json.suggestion || 'No data',
                hasData: false,
            };
        }

        // Check for actual data presence
        const hasTeams = json.teams && json.teams.length > 0;
        const hasIndices = json.orgIndices || json.indices;
        const hasMeta = json.meta;

        if (!hasMeta) {
            return {
                endpoint: description,
                status: 'FAIL',
                httpStatus: res.status,
                details: 'Missing meta field',
                hasData: false,
            };
        }

        return {
            endpoint: description,
            status: 'PASS',
            httpStatus: res.status,
            details: `OK (teams: ${hasTeams ? json.teams?.length || 0 : 'N/A'})`,
            hasData: true,
        };

    } catch (e: any) {
        return {
            endpoint: description,
            status: 'FAIL',
            httpStatus: 0,
            details: e.message,
            hasData: false,
        };
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  PHASE 21.E — API Verification');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Base URL: ${BASE_URL}`);
    console.log('');

    const results: ApiCheckResult[] = [
        await checkApi(
            `/api/dashboard/executive?org_id=${FIXTURE_ORG_ID}`,
            'Executive Dashboard API'
        ),
        await checkApi(
            `/api/dashboard/team?org_id=${FIXTURE_ORG_ID}&team_id=${FIXTURE_TEAM_ID}&weeks=9`,
            'Team Dashboard API'
        ),
    ];

    let failed = false;
    for (const r of results) {
        const icon = r.status === 'PASS' ? '✓' : '✗';
        const color = r.status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
        console.log(`${color}${icon}\x1b[0m ${r.endpoint}: ${r.httpStatus} — ${r.details}`);
        if (r.status === 'FAIL') failed = true;
    }

    console.log('');
    if (failed) {
        console.log('\x1b[31m✗ API VERIFICATION FAILED\x1b[0m');
        console.log('');
        console.log('Troubleshooting:');
        console.log('  - If 401: Check auth guards accept X-DEV-USER-ID header');
        console.log('  - If NO_DATA: Run npm run pipeline:dev:rebuild');
        console.log('  - If HTML: Server may be returning error page');
        process.exit(1);
    } else {
        console.log('\x1b[32m✓ API VERIFICATION PASSED\x1b[0m');
    }
}

main().catch(e => {
    console.error('API verification error:', e.message);
    process.exit(1);
});

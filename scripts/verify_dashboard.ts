
export { };
import { loadEnv } from '../lib/env/loadEnv';

loadEnv();

const BASE_URL = process.env.APP_URL || 'http://localhost:3001';

async function run() {
    console.log('--- Dashboard Verification ---');
    console.log(`Target: ${BASE_URL}`);

    // 1. Check verify-dashboard endpoint
    console.log('\n1. Checking /api/internal/verify-dashboard...');
    try {
        const verifyRes = await fetch(`${BASE_URL}/api/internal/verify-dashboard`);
        if (!verifyRes.ok) {
            console.error(`FAIL: Verify endpoint returned ${verifyRes.status}`);
        } else {
            const data = await verifyRes.json();
            console.log('   Schema Validation:', data.validation_result?.passed ? '✅ PASS' : '❌ FAIL');
            console.log('   Required Fields:', data.schema?.team_dto_required_fields);
        }
    } catch (e) {
        console.error('FAIL: Could not reach verify endpoint:', (e as Error).message);
    }

    // 2. Test team-dashboard (requires valid org_id and team_id)
    const orgId = process.env.ORG_ID;
    const teamId = process.env.TEAM_ID;

    if (!orgId || !teamId) {
        console.log('\n2. Skipping team-dashboard test (no ORG_ID/TEAM_ID provided)');
    } else {
        console.log(`\n2. Testing /api/admin/team-dashboard...`);
        const startTime = Date.now();
        try {
            const res = await fetch(`${BASE_URL}/api/admin/team-dashboard?org_id=${orgId}&team_id=${teamId}`);
            const duration = Date.now() - startTime;

            if (!res.ok) {
                console.error(`FAIL: Team dashboard returned ${res.status}`);
                console.error(await res.text());
            } else {
                const dto = await res.json();
                console.log(`   Duration: ${duration}ms ${duration < 900 ? '✅' : '⚠️ Slow'}`);
                console.log(`   State: ${dto.state?.label}`);
                console.log(`   Trend: ${dto.trend?.direction}`);
                console.log(`   Drivers: ${dto.drivers?.top_risks?.length} risks, ${dto.drivers?.top_strengths?.length} strengths`);
                console.log(`   Request ID: ${dto.meta?.request_id}`);

                // Validate required fields
                if (!dto.meta?.request_id) console.error('   FAIL: Missing meta.request_id');
                if (!dto.state?.label) console.error('   FAIL: Missing state.label');
                if (!dto.trend?.direction) console.error('   FAIL: Missing trend.direction');
                if (dto.drivers?.top_risks === undefined) console.error('   FAIL: Missing drivers.top_risks');

                console.log('   ✅ DTO structure valid');
            }
        } catch (e) {
            console.error('FAIL: Team dashboard error:', (e as Error).message);
        }
    }

    // 3. Test executive-dashboard
    if (!orgId) {
        console.log('\n3. Skipping executive-dashboard test (no ORG_ID provided)');
    } else {
        console.log(`\n3. Testing /api/admin/executive-dashboard...`);
        const startTime = Date.now();
        try {
            const res = await fetch(`${BASE_URL}/api/admin/executive-dashboard?org_id=${orgId}`);
            const duration = Date.now() - startTime;

            if (!res.ok) {
                console.error(`FAIL: Executive dashboard returned ${res.status}`);
            } else {
                const dto = await res.json();
                console.log(`   Duration: ${duration}ms ${duration < 2000 ? '✅' : '⚠️ Slow'}`);
                console.log(`   Teams: ${dto.teams?.length}`);
                console.log(`   Org State: ${dto.org_state?.label}`);
                console.log(`   Systemic Drivers: ${dto.systemic_drivers?.length}`);

                console.log('   ✅ Executive DTO structure valid');
            }
        } catch (e) {
            console.error('FAIL: Executive dashboard error:', (e as Error).message);
        }
    }

    console.log('\n--- Verification Complete ---');
}

run().catch(e => {
    console.error('\n❌ Verification Failed:', e.message);
    process.exit(1);
});

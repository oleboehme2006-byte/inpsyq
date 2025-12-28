
export { };
import './_bootstrap';

// Env loaded by bootstrap

const PROD_URL = process.env.PROD_URL || 'https://www.inpsyq.com';
const USER_ID = process.env.TEST_USER_ID || '';

async function run() {
    console.log('--- Production Session Verification ---');
    console.log(`Target: ${PROD_URL}`);

    // 1. Check Runtime Config
    console.log('\n1. Checking /api/internal/runtime...');
    try {
        const runtimeRes = await fetch(`${PROD_URL}/api/internal/runtime`);
        if (!runtimeRes.ok) {
            console.error(`FAIL: Runtime endpoint returned ${runtimeRes.status}`);
        } else {
            const runtime = await runtimeRes.json();
            console.log('   Session Config:', JSON.stringify(runtime.runtime?.session, null, 2));

            if (runtime.runtime?.session?.targetCount !== 10) {
                console.error(`FAIL: targetCount should be 10, got ${runtime.runtime?.session?.targetCount}`);
            } else {
                console.log('   ✅ targetCount = 10');
            }
        }
    } catch (e) {
        console.error('FAIL: Could not reach runtime endpoint:', (e as Error).message);
    }

    // 2. Test Invalid UUID (Should Return 400)
    console.log('\n2. Testing invalid UUID rejection...');
    try {
        const invalidRes = await fetch(`${PROD_URL}/api/session/start`, {
            method: 'POST',
            body: JSON.stringify({ userId: 'not-a-valid-uuid|' }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (invalidRes.status === 400) {
            const body = await invalidRes.json();
            console.log('   ✅ Invalid UUID rejected with 400');
            console.log('   Response:', JSON.stringify(body));
            if (body.code !== 'INVALID_USERID') {
                console.warn('   WARN: Expected code INVALID_USERID');
            }
        } else {
            console.error(`FAIL: Expected 400 for invalid UUID, got ${invalidRes.status}`);
        }
    } catch (e) {
        console.error('FAIL: Invalid UUID test error:', (e as Error).message);
    }

    // 3. Test Valid Session (Requires Valid User ID)
    if (!USER_ID) {
        console.log('\n3. Skipping valid session test (no TEST_USER_ID provided)');
        console.log('   Set TEST_USER_ID env var to test session creation.');
    } else {
        console.log(`\n3. Testing /api/session/start with user ${USER_ID}...`);
        try {
            const startRes = await fetch(`${PROD_URL}/api/session/start`, {
                method: 'POST',
                body: JSON.stringify({ userId: USER_ID }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!startRes.ok) {
                console.error(`FAIL: Session start returned ${startRes.status}`);
                console.error(await startRes.text());
            } else {
                const session = await startRes.json();
                console.log(`   Session ID: ${session.sessionId}`);
                console.log(`   Interactions: ${session.interactions?.length}`);
                console.log(`   Meta:`, JSON.stringify(session.meta, null, 2));

                if (!session.interactions || session.interactions.length !== 10) {
                    console.error(`FAIL: Expected 10 interactions, got ${session.interactions?.length}`);
                } else {
                    console.log('   ✅ Interaction count = 10');
                }

                if (session.meta?.target_count !== 10) {
                    console.error(`FAIL: meta.target_count should be 10, got ${session.meta?.target_count}`);
                } else {
                    console.log('   ✅ meta.target_count = 10');
                }

                if (session.meta?.request_id) {
                    console.log(`   ✅ request_id present: ${session.meta.request_id}`);
                } else {
                    console.error('   FAIL: meta.request_id missing');
                }
            }
        } catch (e) {
            console.error('FAIL: Session start error:', (e as Error).message);
        }
    }

    console.log('\n--- Verification Complete ---');
}

run().catch(e => {
    console.error('\n❌ Verification Failed:', e.message);
    process.exit(1);
});

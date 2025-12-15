


export { };
import { loadEnv } from '../lib/env/loadEnv';

loadEnv();

const BASE_URL = process.env.APP_URL || 'http://localhost:3001';

async function run() {
    console.log('--- Verifying LLM Session Flow ---');
    console.log(`Target: ${BASE_URL}`);

    let orgId = process.env.ORG_ID;
    let teamId = process.env.TEAM_ID;

    // 1. Get Org/Team IDs (Env or Seed)
    if (orgId && teamId) {
        console.log('1. Using Env IDs:', { orgId, teamId });
    } else {
        console.log('1. Env IDs missing. initializing & seeding...');

        // Init
        const initRes = await fetch(`${BASE_URL}/api/init`, { method: 'GET' });
        if (!initRes.ok) throw new Error(`Init failed: ${initRes.status}`);

        // Seed
        const seedRes = await fetch(`${BASE_URL}/api/seed`, { method: 'GET' });
        if (!seedRes.ok) {
            console.error('Seed Failed Body:', await seedRes.text());
            throw new Error(`Seed failed: ${seedRes.status}`);
        }

        const seedData = await seedRes.json();
        // Validation: Expect camelCase from syntheticDataGenerator
        if (!seedData.orgId || !seedData.teamAId) {
            console.error('Invalid Seed Data:', seedData);
            throw new Error('Seed response missing required IDs (orgId, teamAId)');
        }

        orgId = seedData.orgId;
        teamId = seedData.teamAId;
        console.log('   Seeded:', { orgId, teamId });
    }

    // 2. Fetch Employees
    console.log(`2. Fetching Employees for Org: ${orgId}`);
    const empRes = await fetch(`${BASE_URL}/api/admin/employees?org_id=${orgId}`);
    if (!empRes.ok) throw new Error(`Fetch Employees failed: ${empRes.status}`);

    const employees = await empRes.json();
    if (!Array.isArray(employees) || employees.length === 0) {
        console.error('Employees Response:', employees);
        throw new Error('No employees found for this Org.');
    }

    const userId = employees[0].user_id;
    console.log('   Target User:', userId);

    // 3. Start Session
    const EXPECTED_COUNT = parseInt(process.env.SESSION_QUESTION_COUNT || '10');
    console.log(`3. Starting Session (Expected Questions: ${EXPECTED_COUNT})...`);
    console.log(`   Detailed Diagnosis:`);
    console.log(`   - KEY Present: ${!!process.env.OPENAI_API_KEY}`);
    console.log(`   - MODEL: ${process.env.OPENAI_MODEL || 'gpt-5-mini'}`);

    const startRes = await fetch(`${BASE_URL}/api/session/start`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
        headers: { 'Content-Type': 'application/json' }
    });

    if (!startRes.ok) {
        console.error('Start Session Failed:', await startRes.text());
        throw new Error(`Start failed: ${startRes.status}`);
    }

    const session = await startRes.json();
    console.log(`   Session ID: ${session.sessionId}`);
    console.log(`   Interactions: ${session.interactions.length}`);
    console.log(`   LLM Used: ${session.meta?.is_llm ?? session.llm_used}`);
    console.log(`   Question Count: ${session.meta?.question_count ?? session.question_count}`);
    if (session.meta?.llm_error) {
        console.log(`   ❌ LLM Error:`, JSON.stringify(session.meta.llm_error, null, 2));
    }

    // Validate Length
    if (session.interactions.length < EXPECTED_COUNT) {
        if (session.meta?.is_llm) {
            console.warn('   ⚠️ Warning: LLM used but returned fewer questions than expected.');
        } else {
            console.warn('   ⚠️ Fallback Mode Active (Legacy Count).');
        }
    } else {
        console.log('   ✅ Count Verified.');
    }

    // Print Questions
    session.interactions.forEach((i: any) => {
        const text = i.prompt_text.split('|||')[0].trim();
        console.log(`   - [${i.type}] ${text.slice(0, 60)}...`);
    });

    // 4. Submit Response (Sanity Check)
    console.log('4. Submitting Sample Response...');
    const firstInteraction = session.interactions[0];
    const submitRes = await fetch(`${BASE_URL}/api/session/submit`, {
        method: 'POST',
        body: JSON.stringify({
            userId,
            sessionId: session.sessionId,
            responses: [{
                interaction_id: firstInteraction.interaction_id,
                raw_input: firstInteraction.type === 'slider' ? "5" : "Sample Text"
            }]
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    if (!submitRes.ok) {
        console.error('Submit Failed:', await submitRes.text());
        throw new Error(`Submit failed: ${submitRes.status}`);
    }

    console.log('   Submission OK');
    console.log('--- Verification Complete ---');
}

run().catch(e => {
    console.error('\n❌ Verification Failed:', e.message);
    process.exit(1);
});

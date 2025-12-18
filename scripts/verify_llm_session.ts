


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
        if (!initRes.ok) {
            console.error('Init Failed Body:', await initRes.text());
            throw new Error(`Init failed: ${initRes.status}`);
        }

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
    const ADAPTIVE = process.env.SESSION_ADAPTIVE !== 'false';

    console.log(`3. Starting Session...`);
    console.log(`   Config: COUNT=${EXPECTED_COUNT}, ADAPTIVE=${ADAPTIVE}`);
    console.log(`   LLM Config: KEY=${!!process.env.OPENAI_API_KEY}, MODEL=${process.env.OPENAI_MODEL || 'gpt-5-mini'}`);

    const startRes = await fetch(`${BASE_URL}/api/session/start`, {
        method: 'POST',
        // Send config to force deterministic behavior regardless of server env
        body: JSON.stringify({
            userId,
            config: {
                forceCount: EXPECTED_COUNT,
                forceAdaptive: ADAPTIVE
            }
        }),
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

    // Validate Length
    if (session.interactions.length !== EXPECTED_COUNT) {
        if (ADAPTIVE && !process.env.SESSION_QUESTION_COUNT) {
            console.log(`   ℹ️ Adaptive Length: Received ${session.interactions.length} (Global Default is 10/12). OK.`);
        } else {
            // If manual count set, must match
            if (process.env.SESSION_QUESTION_COUNT) {
                throw new Error(`Count Mismatch! Expected ${EXPECTED_COUNT}, Got ${session.interactions.length}`);
            } else {
                console.warn(`   ⚠️ Received ${session.interactions.length}, expected ~10. (Adaptive? ${ADAPTIVE})`);
            }
        }
    } else {
        console.log('   ✅ Count Exact Match.');
    }

    // Print Questions
    session.interactions.forEach((i: any) => {
        const text = i.prompt_text.split('|||')[0].trim();
        console.log(`   - [${i.type}] ${text.slice(0, 60)}...`);
    });

    // 4. Submit Responses (Complete Session)
    console.log('4. Completing Session (All Interactions)...');

    const responses = session.interactions.map((interaction: any) => {
        let responseText = "Use the Force."; // Default fallback

        // 1. Try to parse Option Codes from prompt
        const parts = interaction.prompt_text.split('|||');
        const specPart = parts.find((p: string) => p.trim().startsWith('{'));

        let codes: string[] = [];
        if (specPart) {
            try {
                const spec = JSON.parse(specPart);
                if (spec.option_codes) {
                    codes = Object.keys(spec.option_codes);
                }
            } catch (e) {
                // ignore parse error
            }
        }

        if (interaction.type === 'slider' || interaction.type === 'rating') {
            responseText = "8"; // Strong positive signal
        } else if (interaction.type === 'choice') {
            if (codes.length > 0) {
                // Pick the first option deterministically
                responseText = codes[0];
            } else {
                responseText = "Option A"; // Fallback
            }
        } else {
            // Text
            responseText = "I feel very supported by my team and we are making great progress despite the workload.";
        }

        return {
            interaction_id: interaction.interaction_id,
            raw_input: responseText
        };
    });

    const submitRes = await fetch(`${BASE_URL}/api/session/submit`, {
        method: 'POST',
        body: JSON.stringify({
            userId,
            sessionId: session.sessionId,
            responses
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    if (!submitRes.ok) {
        console.error('Submit Failed:', await submitRes.text());
        throw new Error(`Submit failed: ${submitRes.status}`);
    }

    const result = await submitRes.json();
    console.log('   Submission OK', result);
    console.log('--- Verification Complete ---');
}

run().catch(e => {
    console.error('\n❌ Verification Failed:', e.message);
    process.exit(1);
});

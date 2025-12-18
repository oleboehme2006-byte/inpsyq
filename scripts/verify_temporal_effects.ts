
import { loadEnv } from '@/lib/env/loadEnv';
loadEnv();

import { responseInterpreter } from '@/services/llm/interpreters';
import { InterpretationContext } from '@/services/interpretation/context';
import { LLM_CONFIG } from '@/services/llm/client';

async function verify() {
    console.log('--- Verifying Model Integrity: Temporal Context ---');
    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ No OpenAI Key. Skipping actual LLM call checks.');
        return;
    }
    console.log(`Model: ${LLM_CONFIG.model}`);

    const ambiguousInput = "It's chaotic as usual.";

    // Case A: No History (Baseline)
    console.log('\nCase A: No History');
    const resA = await responseInterpreter.code(ambiguousInput, {
        prompt: "How is the project management?",
        construct: "role_clarity"
    });
    console.log('Result A:', JSON.stringify(resA?.evidence, null, 2));

    // Case B: History says "Always Chaotic" (High Volatility, Stable negative)
    console.log('\nCase B: History of Chaos/Volatility');
    const contextB: InterpretationContext = {
        user_id: 'test',
        session_count: 5,
        significant_history: [{
            construct: 'role_clarity',
            trend: 'stable',
            volatility: 0.8, // Very volatile
            last_value: 0.2,
            baseline: 0.2,
            days_since_change: 10
        }],
        recent_topics: []
    };

    const resB = await responseInterpreter.code(ambiguousInput, {
        prompt: "How is the project management?",
        construct: "role_clarity",
        history: contextB
    });
    console.log('Result B:', JSON.stringify(resB?.evidence, null, 2));

    // Heuristic Check: 
    // If context is injected, the LLM usually treats "as usual" differently if it knows what "usual" is.
    // Ideally, B might have somewhat different confidence or explanation referencing valid consistency.

    console.log('\n--- TEMPORAL CHECK COMPLETE ---');
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});

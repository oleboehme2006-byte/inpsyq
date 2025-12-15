import { Parameter } from '@/lib/constants';

export interface ParameterSignal {
    parameter: Parameter;
    signal: number; // 0-1
    uncertainty: number; // 0-1
    confidence: number; // 0-1
}

import { responseInterpreter } from './llm/interpreters';

export class LLMAdapter {
    /**
     * Interpret text response into parameter signals.
     * Uses OpenAI via ResponseInterpreter if configured, otherwise falls back to heuristics.
     */
    async interpretTextResponse(text: string, targets: Parameter[]): Promise<ParameterSignal[]> {

        // Try LLM Interpreter
        const interpretation = await responseInterpreter.interpret(text, targets);

        if (interpretation) {
            // Map structured result to ParameterSignal
            return interpretation.signals.map(s => ({
                parameter: s.parameter,
                signal: s.value,
                uncertainty: 1 - s.confidence,
                confidence: s.confidence
            }));
        }

        console.log('[LLM] No interpretation result (missing key or error). Using heuristics.');
        return this.heuristicFallback(text, targets);
    }

    /**
     * Deterministic Heuristic Fallback (Original Mock Logic)
     */
    private heuristicFallback(text: string, targets: Parameter[]): ParameterSignal[] {
        const lower = text.toLowerCase();
        const results: ParameterSignal[] = [];

        // 1. Keyword Sentiment Analysis
        const positiveKeywords = ['good', 'great', 'happy', 'love', 'support', 'trust', 'safe', 'clear', 'help'];
        const negativeKeywords = ['bad', 'stress', 'hard', 'tired', 'confused', 'alone', 'fear', 'angry', 'fail'];

        let sentiment = 0; // -1 to 1
        positiveKeywords.forEach(k => { if (lower.includes(k)) sentiment += 1; });
        negativeKeywords.forEach(k => { if (lower.includes(k)) sentiment -= 1; });

        // 2. Base Signal Calculation for Targets
        for (const target of targets) {
            let base = 0.5;
            if (sentiment > 0) base = 0.7 + (Math.min(sentiment, 3) * 0.05);
            if (sentiment < 0) base = 0.3 + (Math.max(sentiment, -3) * 0.05);

            // 3. Specific Overrides
            let val = Math.max(0, Math.min(1, base));
            let unc = 0.15; // default uncertainty

            if (target === 'emotional_load' && (lower.includes('stress') || lower.includes('overwhelm'))) {
                val = 0.9;
                unc = 0.1;
            }
            if (target === 'autonomy_friction' && (lower.includes('micromanage') || lower.includes('blocker'))) {
                val = 0.9;
                unc = 0.1;
            }
            if (target === 'meaning' && (lower.includes('meaning') || lower.includes('purpose'))) {
                val = 0.85;
                unc = 0.1;
            }
            if (target === 'control' && (lower.includes('micromanage'))) {
                val = 0.2;
                unc = 0.1;
            }

            results.push({
                parameter: target,
                signal: val,
                uncertainty: unc,
                confidence: 0.8 // high confidence in heuristics for now
            });
        }

        return results;
    }
}

export const llmAdapter = new LLMAdapter();

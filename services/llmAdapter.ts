import { responseInterpreter } from './llm/interpreters';
import { Evidence } from '@/services/measurement/evidence';
import { Construct, CONSTRUCTS } from '@/services/measurement/constructs';

export class LLMAdapter {
    /**
     * Code text response into Evidence signals.
     * Uses OpenAI via ResponseInterpreter if configured, otherwise falls back to heuristics.
     */
    async codeResponse(text: string, type: string, context: { prompt?: string, construct?: string }): Promise<Evidence[]> {
        // Try LLM Interpreter
        const result = await responseInterpreter.code(text, context);

        if (result && result.evidence) {
            return result.evidence;
        }

        console.log('[LLM] No coding result (missing key or error). Using heuristics.');
        return this.heuristicEvidenceFallback(text, context.construct as Construct);
    }

    /**
     * Deterministic Heuristic Fallback (Evidence-based)
     */
    private heuristicEvidenceFallback(text: string, constructHint: Construct): Evidence[] {
        const lower = text.toLowerCase();
        const evidence: Evidence[] = [];

        // Simple Sentiment Mapping
        const positiveKeywords = ['good', 'great', 'happy', 'love', 'support', 'trust', 'safe', 'clear', 'help'];
        const negativeKeywords = ['bad', 'stress', 'hard', 'tired', 'confused', 'alone', 'fear', 'angry', 'fail'];

        let sentiment = 0; // -1 to 1
        positiveKeywords.forEach(k => { if (lower.includes(k)) sentiment += 1; });
        negativeKeywords.forEach(k => { if (lower.includes(k)) sentiment -= 1; });

        // If no sentiment and text is short, return empty (neutral)
        if (sentiment === 0 && text.length < 10) return [];

        const direction = sentiment >= 0 ? 1 : -1;
        const strength = Math.min(Math.abs(sentiment) * 0.3 + 0.3, 1.0); // 0.3 base + boost

        // Use context construct if valid, otherwise fallback to 'engagement' (generic)
        let validConstruct: Construct = 'engagement'; // Default

        // Check if constructHint is valid
        // We cast because constructHint comes from untyped legacy sources sometimes
        if (CONSTRUCTS.includes(constructHint as Construct)) {
            validConstruct = constructHint;
        } else if (constructHint === 'trust' as any) {
            // Legacy mapping
            validConstruct = 'trust_leadership';
        }

        evidence.push({
            construct: validConstruct,
            direction,
            strength,
            confidence: 0.6, // Moderate confidence for heuristic
            evidence_type: 'self_report',
            explanation_short: 'Heuristic keyword analysis'
        });

        return evidence;
    }
}

export const llmAdapter = new LLMAdapter();

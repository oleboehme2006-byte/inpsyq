import { PARAMETERS, Parameter } from '../lib/constants';

export interface EncodedSignal {
    signals: Record<Parameter, number>;
    uncertainty: Record<Parameter, number>;
    confidence: number;
    flags: {
        too_short: boolean;
        nonsense: boolean;
        self_harm_risk: boolean;
    };
    topics: string[];
}

export class EncoderService {
    /**
     * MOCK connection to LLM.
     * Strict deterministic heuristics based on input length/content and type.
     */
    async encode(responseText: string, type: string, targets: string[]): Promise<EncodedSignal> {

        const signals: any = {};
        const uncertainty: any = {};
        const flags = {
            too_short: false,
            nonsense: false,
            self_harm_risk: false
        };
        let confidence = 0.8; // Baseline high

        // Initialize all params to neutral with high uncertainty
        PARAMETERS.forEach(p => {
            signals[p] = 0.5;
            uncertainty[p] = 0.22; // Default non-target sigma
        });

        const safeTargets = targets as Parameter[];

        // --- 1. SCALE Heuristics ---
        if (type === 'slider' || type === 'rating') {
            const val = parseInt(responseText);
            if (!isNaN(val) && val >= 1 && val <= 7) {
                const normalized = (val - 1) / 6; // 0..1
                safeTargets.forEach(t => {
                    signals[t] = normalized;
                    uncertainty[t] = 0.10; // Low uncertainty for direct rating
                });
            } else {
                // Fallback if they somehow sent text for a slider
                flags.nonsense = true;
                confidence = 0.1;
            }
        }
        // --- 2. CHOICE Heuristics ---
        else if (type === 'choice') {
            // A, B, C mapping
            const char = responseText.trim().toUpperCase().charAt(0);

            safeTargets.forEach(t => {
                uncertainty[t] = 0.12;
            });

            if (char === 'A') {
                // A: High Control, Low Friction
                if (safeTargets.includes('control')) signals.control = 0.8;
                if (safeTargets.includes('autonomy_friction')) signals.autonomy_friction = 0.2;
                // Generic "Positive/Active" for others
                safeTargets.forEach(t => { if (t !== 'control' && t !== 'autonomy_friction') signals[t] = 0.7; });
            } else if (char === 'B') {
                // B: Mixed / Neutral
                safeTargets.forEach(t => signals[t] = 0.5);
            } else if (char === 'C') {
                // C: Low Control, High Friction (Stress)
                if (safeTargets.includes('control')) signals.control = 0.2;
                if (safeTargets.includes('autonomy_friction')) signals.autonomy_friction = 0.8;
                safeTargets.forEach(t => { if (t !== 'control' && t !== 'autonomy_friction') signals[t] = 0.3; });
            } else {
                flags.nonsense = true;
                confidence = 0.2;
            }
        }
        // --- 3. TEXT / DIALOG Heuristics ---
        else {
            // Length checks
            if (responseText.length < 10) {
                flags.too_short = true;
                confidence = 0.4;
                PARAMETERS.forEach(p => uncertainty[p] = 0.28);
            }

            // Simple Keyword Analysis
            const lower = responseText.toLowerCase();

            const positiveKeywords = ['good', 'great', 'happy', 'love', 'support', 'trust', 'safe', 'clear', 'help'];
            const negativeKeywords = ['bad', 'stress', 'hard', 'tired', 'confused', 'alone', 'fear', 'angry', 'fail'];

            let sentiment = 0; // -1 to 1
            positiveKeywords.forEach(k => { if (lower.includes(k)) sentiment += 1; });
            negativeKeywords.forEach(k => { if (lower.includes(k)) sentiment -= 1; });

            // Calculate Target Signals based on sentiment
            safeTargets.forEach(t => {
                let base = 0.5;
                if (sentiment > 0) base = 0.7 + (Math.min(sentiment, 3) * 0.05);
                if (sentiment < 0) base = 0.3 + (Math.max(sentiment, -3) * 0.05); // e.g. 0.3 - 0.15 = 0.15

                signals[t] = Math.max(0, Math.min(1, base));
                uncertainty[t] = 0.15;
            });

            // Specific Overrides
            if (lower.includes('stress') || lower.includes('overwhelm')) {
                signals.emotional_load = 0.9;
                uncertainty.emotional_load = 0.1;
            }
            if (lower.includes('micromanage') || lower.includes('blocker')) {
                signals.autonomy_friction = 0.9;
                signals.control = 0.2;
            }
            if (lower.includes('meaning') || lower.includes('purpose')) {
                signals.meaning = 0.85;
            }

            if (type === 'dialog' && responseText.length < 5) {
                flags.nonsense = true;
                confidence = 0.1;
            }
        }

        return {
            signals,
            uncertainty,
            confidence,
            flags,
            topics: ['mock_topic']
        };
    }
}

export const encoderService = new EncoderService();

import { Parameter, PARAMETERS } from '@/lib/constants';
import { llmAdapter } from './llmAdapter';

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

export class NormalizationService {

    async normalizeResponse(responseText: string, type: string, targets: Parameter[]): Promise<EncodedSignal> {
        const signals: any = {};
        const uncertainty: any = {};
        const flags = {
            too_short: false,
            nonsense: false,
            self_harm_risk: false
        };
        let confidence = 0.8;

        // Initialize defaults
        PARAMETERS.forEach(p => {
            signals[p] = 0.5;
            uncertainty[p] = 0.22;
        });

        // --- 1. SLIDER / RATING ---
        if (type === 'slider' || type === 'rating') {
            const val = parseInt(responseText);
            if (!isNaN(val) && val >= 1 && val <= 7) {
                const normalized = (val - 1) / 6; // 0..1
                targets.forEach(t => {
                    signals[t] = normalized;
                    uncertainty[t] = 0.10;
                });
            } else {
                flags.nonsense = true;
                confidence = 0.1;
            }
        }
        // --- 2. CHOICE ---
        else if (type === 'choice') {
            const char = responseText.trim().toUpperCase().charAt(0);

            // Legacy A/B/C Check (Single Char input)
            if (responseText.trim().length === 1 && ['A', 'B', 'C'].includes(char)) {
                targets.forEach(t => uncertainty[t] = 0.12);
                if (char === 'A') {
                    if (targets.includes('control')) signals.control = 0.8;
                    if (targets.includes('autonomy_friction')) signals.autonomy_friction = 0.2;
                    targets.forEach(t => { if (t !== 'control' && t !== 'autonomy_friction') signals[t] = 0.7; });
                } else if (char === 'B') {
                    targets.forEach(t => signals[t] = 0.5);
                } else if (char === 'C') {
                    if (targets.includes('control')) signals.control = 0.2;
                    if (targets.includes('autonomy_friction')) signals.autonomy_friction = 0.8;
                    targets.forEach(t => { if (t !== 'control' && t !== 'autonomy_friction') signals[t] = 0.3; });
                }
            } else {
                // Dynamic Choice (Full Text) -> Use LLM Adapter
                const analysis = await llmAdapter.interpretTextResponse(responseText, targets);
                analysis.forEach(a => {
                    signals[a.parameter] = a.signal;
                    uncertainty[a.parameter] = a.uncertainty;
                });

                // If LLM returned nothing or failed, we might want to flag nonsense, 
                // but llmAdapter fallback heuristics usually cover it.
                if (analysis.length === 0) {
                    flags.nonsense = true;
                    confidence = 0.2;
                }
            }
        }
        // --- 3. TEXT ---
        else {
            // Length Check
            if (responseText.length < 10) {
                flags.too_short = true;
                confidence = 0.4;
                // High uncertainty
                targets.forEach(t => uncertainty[t] = 0.29);
            } else {
                // Use LLM Adapter
                const analysis = await llmAdapter.interpretTextResponse(responseText, targets);
                analysis.forEach(a => {
                    signals[a.parameter] = a.signal;
                    uncertainty[a.parameter] = a.uncertainty;
                });
            }
        }

        return {
            signals,
            uncertainty,
            confidence,
            flags,
            topics: ['normalized']
        };
    }
}

export const normalizationService = new NormalizationService();

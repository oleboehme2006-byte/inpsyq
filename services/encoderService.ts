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
     * strict deterministic heuristics based on input length/content.
     */
    async encode(responseText: string): Promise<EncodedSignal> {
        const isMock = process.env.MOCK_MODE === 'true'; // Ensure mock mode.

        // Default Mock Response
        const signals: any = {};
        const uncertainty: any = {};

        // Generate some deterministic variation
        const hash = responseText.length % 10;

        PARAMETERS.forEach(p => {
            signals[p] = (hash / 10) + (Math.random() * 0.2); // Random-ish but tied to length
            uncertainty[p] = 0.1;
        });

        const confidence = responseText.length > 20 ? 0.8 : 0.4;
        const isNonsense = responseText.length < 5;

        return {
            signals,
            uncertainty,
            confidence,
            flags: {
                too_short: responseText.length < 10,
                nonsense: isNonsense,
                self_harm_risk: false
            },
            topics: ['mock_topic']
        };
    }
}

export const encoderService = new EncoderService();

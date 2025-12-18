import { Parameter } from '@/lib/constants';
import { llmAdapter } from './llmAdapter';
import { Evidence } from '@/services/measurement/evidence';
import { measurementService } from '@/services/measurement/measurement';
import { mapMeasurementsToSignals, EncodedSignal } from '@/services/measurement/param_map';

export type { EncodedSignal };

export class NormalizationService {

    async normalizeResponse(responseText: string, type: string, targets: Parameter[], interaction?: any): Promise<EncodedSignal> {
        let evidenceList: Evidence[] = [];

        // --- 1. Deterministic Choice (Option Codes) ---
        // Metadata format: prompt_text ||| META_JSON
        if (type === 'choice' && interaction?.prompt_text?.includes('|||')) {
            try {
                const parts = interaction.prompt_text.split('|||');
                const specIndex = parts.findIndex((p: string) => p.trim().startsWith('{')); // Find JSON part
                if (specIndex > -1) {
                    const spec = JSON.parse(parts[specIndex].trim());

                    // If we have option_codes, try to match
                    if (spec.option_codes) {
                        // Exact match check (case insensitive trim)
                        const matchLabel = Object.keys(spec.option_codes).find(label =>
                            label.toLowerCase().trim() === responseText.toLowerCase().trim()
                        );

                        if (matchLabel) {
                            // Found deterministic evidence
                            evidenceList = spec.option_codes[matchLabel] as Evidence[];
                        }
                    }
                }
            } catch (e) {
                console.warn('[Normalization] Failed to parse option codes', e);
            }
        }

        // --- 2. Fallback / Text Coding ---
        // If no evidence found yet (e.g. Text response, or Choice mismatch/legacy)
        if (evidenceList.length === 0) {
            const context = {
                prompt: interaction?.prompt_text?.split('|||')[0].trim() || 'Unknown',
                construct: interaction?.construct || interaction?.targets?.[0] || 'unknown'
            };

            try {
                // LLM Adapter (or Heuristic Fallback)
                evidenceList = await llmAdapter.codeResponse(responseText, type, context);
            } catch (e) {
                console.error('[Normalization] LLM Coding Failed', e);
                evidenceList = []; // Will result in neutral measurement
            }
        }

        // --- 3. Measurement Aggregation ---
        // Aggregates raw evidence (potentially conflicting/noisy) into stable Construct Measurements (Mean/Sigma)
        const measurements = measurementService.aggregate(evidenceList);

        // --- 4. Parameter Mapping ---
        // Maps Construct Measurements to core Frozen Parameters
        const result = mapMeasurementsToSignals(measurements);

        return result;
    }
}

export const normalizationService = new NormalizationService();

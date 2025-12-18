
import { Item } from '../measurement/item_bank_factory/types';
import { processItem } from './rewrite_engine';
import { getAllowedTones, DEFAULT_TONE } from './tone_map';

export const voiceService = {
    /**
     * Applies the Voice & Framing Layer to a raw item.
     * Returns a safe, neutral version suitable for employee display.
     * Original text is preserved in `original_text` property if modified.
     */
    applyVoiceLayer(item: Item): Item & { original_text?: string } {
        // Determine target tone
        // For now, we default to the first allowed tone for the intent.
        // In future, we could pick based on user history (e.g. if they prefer data vs feelings).
        const allowedTones = getAllowedTones(item.intent || 'explore'); // Safe default
        const tone = allowedTones[0] || DEFAULT_TONE;

        // Verify if item already matches tone? 
        // The rewrite engine currently just applies NEGATIVE rules (removing bad stuff).
        // It doesn't yet enforce "Tone" via generative rewrite (LLM).
        // Per instructions: "Rule-based first... LLM assisted ONLY if rewrite cannot be resolved".
        // We start with Rule-Based.

        return processItem(item, tone);
    }
};

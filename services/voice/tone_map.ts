
import { ToneClass } from './types';
import { Construct } from '../measurement/constructs';
import { MeasurementIntent } from '../measurement/item_bank_factory/types';

/**
 * Maps constructs and intents to allowed/default tones.
 * This ensures we don't use 'behavioral' (hard) language for 'ignorant' (sensitive) states.
 */
export const TONE_MAP: Record<MeasurementIntent, ToneClass[]> = {
    'explore': ['diagnostic', 'reflective'], // Soft, open
    'confirm': ['diagnostic', 'behavioral'], // Standard, specific
    'challenge': ['behavioral', 'diagnostic'], // Hard, specific
    'stabilize': ['diagnostic'] // Neutral
};

export const DEFAULT_TONE: ToneClass = 'diagnostic';

export function getAllowedTones(intent: MeasurementIntent): ToneClass[] {
    return TONE_MAP[intent] || [DEFAULT_TONE];
}

export function validateTone(tone: ToneClass, intent: MeasurementIntent): boolean {
    const allowed = getAllowedTones(intent);
    return allowed.includes(tone);
}

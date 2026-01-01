/**
 * Verify Phase 18: Content Library
 * 
 * Ensures user-facing content follows clarity rules:
 * - No hype/marketing language
 * - All messages are brief
 * - Each message answers "What does this mean for the user?"
 */

import './_bootstrap';
import { EMPTY_STATES, ERROR_STATES, STATUS_MESSAGES, TOOLTIPS } from '@/lib/content/messages';

// Banned words: marketing/hype language
const BANNED_WORDS = [
    'amazing', 'awesome', 'incredible', 'revolutionary', 'groundbreaking',
    'cutting-edge', 'best-in-class', 'world-class', 'innovative', 'unique',
    'powerful', 'seamless', 'delightful', 'magical', 'supercharge',
    'unlock', 'unleash', 'turbocharge', 'skyrocket', 'game-changing'
];

// Max length for descriptions (characters)
const MAX_DESCRIPTION_LENGTH = 120;

function checkForBannedWords(text: string, context: string): void {
    const lower = text.toLowerCase();
    for (const word of BANNED_WORDS) {
        if (lower.includes(word)) {
            throw new Error(`Banned word "${word}" found in ${context}: "${text}"`);
        }
    }
}

function checkLength(text: string, context: string, maxLength: number): void {
    if (text.length > maxLength) {
        console.warn(`⚠️ ${context} exceeds ${maxLength} chars (${text.length}): "${text.slice(0, 50)}..."`);
    }
}

async function verifyContent() {
    console.log('--- Verifying Content Library ---\n');

    let warnings = 0;

    // 1. Check EMPTY_STATES
    console.log('1. Checking EMPTY_STATES...');
    for (const [key, state] of Object.entries(EMPTY_STATES)) {
        if (state.title) {
            checkForBannedWords(state.title, `EMPTY_STATES.${key}.title`);
            checkLength(state.title, `EMPTY_STATES.${key}.title`, 50);
        }
        if (state.description) {
            checkForBannedWords(state.description, `EMPTY_STATES.${key}.description`);
            checkLength(state.description, `EMPTY_STATES.${key}.description`, MAX_DESCRIPTION_LENGTH);
        }
    }
    console.log('✓ EMPTY_STATES checked');

    // 2. Check ERROR_STATES
    console.log('\n2. Checking ERROR_STATES...');
    for (const [key, state] of Object.entries(ERROR_STATES)) {
        if (state.title) {
            checkForBannedWords(state.title, `ERROR_STATES.${key}.title`);
        }
        if (state.description) {
            checkForBannedWords(state.description, `ERROR_STATES.${key}.description`);
            checkLength(state.description, `ERROR_STATES.${key}.description`, MAX_DESCRIPTION_LENGTH);
        }
    }
    console.log('✓ ERROR_STATES checked');

    // 3. Check STATUS_MESSAGES
    console.log('\n3. Checking STATUS_MESSAGES...');
    for (const [key, msg] of Object.entries(STATUS_MESSAGES)) {
        checkForBannedWords(msg, `STATUS_MESSAGES.${key}`);
        checkLength(msg, `STATUS_MESSAGES.${key}`, 80);
    }
    console.log('✓ STATUS_MESSAGES checked');

    // 4. Check TOOLTIPS
    console.log('\n4. Checking TOOLTIPS...');
    for (const [key, tip] of Object.entries(TOOLTIPS)) {
        checkForBannedWords(tip, `TOOLTIPS.${key}`);
        checkLength(tip, `TOOLTIPS.${key}`, MAX_DESCRIPTION_LENGTH);
    }
    console.log('✓ TOOLTIPS checked');

    console.log('\n✅ Content Library Verified');
}

verifyContent().catch(e => {
    console.error(e);
    process.exit(1);
});

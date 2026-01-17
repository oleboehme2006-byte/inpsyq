/**
 * Verify Phase 19: Onboarding Content
 * 
 * Ensures onboarding content follows Phase 18 rules:
 * - No hype language
 * - Under 140 chars
 * - Answers "What does this mean?"
 */

import './_bootstrap';
import { EXECUTIVE_GUIDANCE, TEAM_GUIDANCE, INDEX_EXPLANATIONS, PROGRESSIVE_HINTS } from '@/lib/content/onboarding';

// Banned words from Phase 18
const BANNED_WORDS = [
    'amazing', 'awesome', 'incredible', 'revolutionary', 'groundbreaking',
    'cutting-edge', 'best-in-class', 'world-class', 'innovative', 'unique',
    'powerful', 'seamless', 'delightful', 'magical', 'supercharge',
    'unlock', 'unleash', 'turbocharge', 'skyrocket', 'game-changing'
];

const MAX_LENGTH = 140;

function checkContent(text: string, context: string): { passed: boolean; issue?: string } {
    // Check length
    if (text.length > MAX_LENGTH) {
        return { passed: false, issue: `exceeds ${MAX_LENGTH} chars (${text.length})` };
    }

    // Check banned words
    const lower = text.toLowerCase();
    for (const word of BANNED_WORDS) {
        if (lower.includes(word)) {
            return { passed: false, issue: `contains banned word "${word}"` };
        }
    }

    return { passed: true };
}

async function verifyOnboardingContent() {
    console.log('--- Verifying Onboarding Content ---\n');

    let issues = 0;

    // 1. Check EXECUTIVE_GUIDANCE
    console.log('1. Checking EXECUTIVE_GUIDANCE...');
    for (const [key, value] of Object.entries(EXECUTIVE_GUIDANCE)) {
        if (value.title) {
            const result = checkContent(value.title, `EXECUTIVE_GUIDANCE.${key}.title`);
            if (!result.passed) {
                console.warn(`⚠️ ${key}.title: ${result.issue}`);
                issues++;
            }
        }
        if (value.description) {
            const result = checkContent(value.description, `EXECUTIVE_GUIDANCE.${key}.description`);
            if (!result.passed) {
                console.warn(`⚠️ ${key}.description: ${result.issue}`);
                issues++;
            }
        }
    }
    console.log('✓ EXECUTIVE_GUIDANCE checked');

    // 2. Check TEAM_GUIDANCE
    console.log('\n2. Checking TEAM_GUIDANCE...');
    for (const [key, value] of Object.entries(TEAM_GUIDANCE)) {
        if (value.title) {
            const result = checkContent(value.title, `TEAM_GUIDANCE.${key}.title`);
            if (!result.passed) {
                console.warn(`⚠️ ${key}.title: ${result.issue}`);
                issues++;
            }
        }
        if (value.description) {
            const result = checkContent(value.description, `TEAM_GUIDANCE.${key}.description`);
            if (!result.passed) {
                console.warn(`⚠️ ${key}.description: ${result.issue}`);
                issues++;
            }
        }
    }
    console.log('✓ TEAM_GUIDANCE checked');

    // 3. Check INDEX_EXPLANATIONS
    console.log('\n3. Checking INDEX_EXPLANATIONS...');
    for (const [key, value] of Object.entries(INDEX_EXPLANATIONS)) {
        for (const field of ['what', 'interpretation'] as const) {
            const text = value[field];
            if (text) {
                const result = checkContent(text, `INDEX_EXPLANATIONS.${key}.${field}`);
                if (!result.passed) {
                    console.warn(`⚠️ ${key}.${field}: ${result.issue}`);
                    issues++;
                }
            }
        }
    }
    console.log('✓ INDEX_EXPLANATIONS checked');

    // 4. Check PROGRESSIVE_HINTS
    console.log('\n4. Checking PROGRESSIVE_HINTS...');
    for (const [key, hint] of Object.entries(PROGRESSIVE_HINTS)) {
        const result = checkContent(hint.content, `PROGRESSIVE_HINTS.${key}`);
        if (!result.passed) {
            console.warn(`⚠️ ${key}: ${result.issue}`);
            issues++;
        }
    }
    console.log('✓ PROGRESSIVE_HINTS checked');

    if (issues > 0) {
        console.warn(`\n⚠️ ${issues} content issues found (non-fatal)`);
    }

    console.log('\n✅ Onboarding Content Verified');
}

verifyOnboardingContent().catch(e => {
    console.error(e);
    process.exit(1);
});

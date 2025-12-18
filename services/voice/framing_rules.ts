
import { FramingRule } from './types';

/**
 * Strict regex-based rules to neutralize power dynamics and managerial language.
 * Goal: Transform "Evaluative/Hierarchical" -> "Observational/Systemic".
 */
export const POWER_NEUTRALIZATION_RULES: FramingRule[] = [
    // 1. MANAGER -> CONTEXT/STRUCTURE
    {
        id: 'neut_manager_noun',
        pattern: /\b((my|your|the|a)\s+)?(manager|supervisor|lead|boss|leadership|management)\b/gi,
        replacement: 'the work context',
        description: "Replaces direct authority references with structural terms.",
        category: 'power_neutralization'
    },
    {
        id: 'neut_manager_eval',
        pattern: /\b(manager evaluates|manager checks|manager reviews)\b/gi,
        replacement: 'progress is reviewed',
        description: "Passive voice for evaluation to remove personal judgment.",
        category: 'power_neutralization'
    },

    // 2. PERFORMANCE -> OUTCOMES
    {
        id: 'neut_performance_review',
        pattern: /\b(performance review|performance evaluation|appraisal)\b/gi,
        replacement: 'reflection on outcomes',
        description: "Softens clinical HR terms.",
        category: 'power_neutralization'
    },
    {
        id: 'neut_fail_succeed',
        pattern: /\b(fail to|succeed in|failure|success)\b/gi,
        replacement: (match) => match.toLowerCase().includes('fail') ? 'encounter blockers to' : 'achieve',
        description: "Removes binary success/failure framing.",
        category: 'safety'
    },

    // 3. SURVEILLANCE -> VISIBILITY
    {
        id: 'neut_monitor',
        pattern: /\b(monitored|tracked|watched|observed)\b/gi,
        replacement: 'made visible',
        description: "Reframes surveillance as transparency.",
        category: 'safety'
    },

    // 4. PRECRIPTIVE -> DESCRIPTIVE
    {
        id: 'neut_should',
        pattern: /\b(should|must|ought to)\b/gi,
        replacement: 'tends to',
        description: "Removes moral/normative pressure.",
        category: 'tone_normalization'
    },

    // 5. SPECIFIC HIERARCHY REMOVAL
    {
        id: 'neut_execs',
        pattern: /\b(executives|senior leaders|c-suite)\b/gi,
        replacement: 'organizational strategy',
        description: "Abstracts people to functions.",
        category: 'power_neutralization'
    }
];

export const LABEL_SANITIZATION_RULES: FramingRule[] = [
    {
        id: 'label_good_bad',
        pattern: /\b(very bad|terrible|poor)\b/gi,
        replacement: 'Not Aligned', // Neutral negative
        description: "Removes judgmental adjectives from choices.",
        category: 'safety'
    },
    {
        id: 'label_good_bad_pos',
        pattern: /\b(very good|excellent|perfect)\b/gi,
        replacement: 'Strongly Aligned', // Neutral positive
        description: "Removes praise adjectives from choices.",
        category: 'safety'
    }
];

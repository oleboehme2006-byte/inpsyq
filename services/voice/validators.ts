
import { POWER_NEUTRALIZATION_RULES, LABEL_SANITIZATION_RULES } from './framing_rules';

export function validateSafeText(text: string): { safe: boolean, violations: string[] } {
    const violations: string[] = [];
    const lower = text.toLowerCase();

    // Check against all rules patterns to ensure they are NOT present (i.e. if rewrite failed)
    const allRules = [...POWER_NEUTRALIZATION_RULES, ...LABEL_SANITIZATION_RULES];

    for (const rule of allRules) {
        if (rule.pattern.test(text)) {
            // Note: Regex.test is stateful with /g flag. We use match or reset.
            // Safest to just re-construct regex without global if we just want existence.
            // But here we rely on the rule definitions.
            violations.push(`Contains prohibited pattern: ${rule.id} (${rule.description})`);
        }
    }

    // Hardcoded "Manager" check (Red Line)
    if (/\bmanager\b/i.test(text)) {
        violations.push("CRITICAL: Explicit 'manager' reference found.");
    }

    // Evaluation check
    if (/\bperformance\b/i.test(text) && /\breview\b/i.test(text)) {
        violations.push("CRITICAL: 'Performance review' framing found.");
    }

    return {
        safe: violations.length === 0,
        violations
    };
}

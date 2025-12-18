
import { Construct, isValidConstruct } from './constructs';

export type AssessmentType = 'slider' | 'choice' | 'text';

export interface ItemQuality {
    clarity: number; // 0-1
    discrimination: number; // 0-1 (theoretical)
    grade_level: number; // < 12 ideally
    flags: string[];
}

export interface ItemBankEntry {
    item_id: string; // hash or uuid
    prompt_text: string;
    construct: Construct;
    type: AssessmentType;
    quality_score: number;
    usage_count: number;
    last_used?: string; // ISO date
}

export class ItemBankService {

    /**
     * Validates an item against psychometric quality rules.
     * Hueristics only (since we don't have a human in the loop yet).
     */
    validateItemQuality(text: string, type: AssessmentType, construct: string): ItemQuality {
        const flags: string[] = [];
        let clarity = 1.0;
        let grade_level = 8; // assumption

        // Rule 1: Length (Too short = vague, Too long = cognitive load)
        if (text.length < 15) {
            clarity -= 0.3;
            flags.push('too_short');
        } else if (text.length > 150) {
            clarity -= 0.2;
            flags.push('too_long');
        }

        // Rule 2: Double-barreled questions (containing "and" / "or" heavily)
        // Simple heuristic: "and" appears more than once implies complexity
        if ((text.match(/ and /g) || []).length > 1) {
            clarity -= 0.2;
            flags.push('double_barreled');
        }

        // Rule 3: Construct Validity
        if (!isValidConstruct(construct)) {
            clarity = 0;
            flags.push('invalid_construct');
        }

        // Rule 4: Leading questions (Starts with "Don't you agree...")
        if (text.match(/Don'?t you agree|Shouldn'?t/i)) {
            clarity -= 0.4;
            flags.push('leading_question');
        }

        const score = Math.max(0, clarity);

        return {
            clarity: score,
            discrimination: 0.8, // Default assumption for valid items
            grade_level,
            flags
        };
    }
}

export const itemBank = new ItemBankService();

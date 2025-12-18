
// Deduplication Utilities (Jaccard / Shingling)

const SHINGLE_SIZE = 3;
const SIMILARITY_THRESHOLD = 0.75; // Above this, considered duplicate

export function normalizeText(text: string): string {
    return text.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}

export function createShingles(text: string): Set<string> {
    const normalized = normalizeText(text);
    const words = normalized.split(" ");
    const shingles = new Set<string>();

    // If too short, just use words
    if (words.length < SHINGLE_SIZE) {
        words.forEach(w => shingles.add(w));
        return shingles;
    }

    for (let i = 0; i <= words.length - SHINGLE_SIZE; i++) {
        const shingle = words.slice(i, i + SHINGLE_SIZE).join(" ");
        shingles.add(shingle);
    }
    return shingles;
}

// Safe iteration for older targets
export function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    const intersection = new Set(Array.from(setA).filter(x => setB.has(x)));
    const union = new Set([...Array.from(setA), ...Array.from(setB)]);
    return intersection.size / union.size;
}

export function isDuplicate(newText: string, existingTexts: string[]): { duplicate: boolean, match?: string, score?: number } {
    const newShingles = createShingles(newText);

    for (const existing of existingTexts) {
        const existingShingles = createShingles(existing);
        const score = calculateJaccardSimilarity(newShingles, existingShingles);

        if (score > SIMILARITY_THRESHOLD) {
            return { duplicate: true, match: existing, score };
        }
    }

    return { duplicate: false };
}

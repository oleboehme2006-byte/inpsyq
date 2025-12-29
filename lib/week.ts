/**
 * CANONICAL WEEKLY WINDOW
 * 
 * Single source of truth for ISO week resolution.
 * Used everywhere in Phase 11.
 */

/**
 * Get canonical week start (Monday 00:00 UTC) and label.
 * 
 * @param now - Reference date (defaults to current time)
 * @param override - Optional explicit week start (YYYY-MM-DD, admin/internal only)
 */
export function getCanonicalWeek(now?: Date, override?: string): {
    weekStart: Date;
    weekStartStr: string;
    weekLabel: string;
} {
    let weekStart: Date;

    if (override) {
        // Parse override as UTC date
        const parsed = new Date(override + 'T00:00:00Z');
        if (isNaN(parsed.getTime())) {
            throw new Error(`Invalid week_start override: ${override}`);
        }
        // Normalize to Monday if not already
        weekStart = normalizeToMonday(parsed);
    } else {
        // Use current time, normalize to Monday
        weekStart = normalizeToMonday(now || new Date());
    }

    const weekStartStr = formatDateStr(weekStart);
    const weekLabel = getISOWeekLabel(weekStart);

    return { weekStart, weekStartStr, weekLabel };
}

/**
 * Get the Monday of the week containing the given date.
 */
function normalizeToMonday(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);

    // getUTCDay: 0=Sunday, 1=Monday, ..., 6=Saturday
    const dayOfWeek = d.getUTCDay();
    // Calculate days to subtract to get to Monday (1)
    // If Sunday (0), go back 6 days; else go back (day - 1) days
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    d.setUTCDate(d.getUTCDate() - daysToSubtract);
    return d;
}

/**
 * Format date as YYYY-MM-DD.
 */
function formatDateStr(date: Date): string {
    return date.toISOString().slice(0, 10);
}

/**
 * Get ISO week label (e.g., "2025-W03").
 */
function getISOWeekLabel(date: Date): string {
    // ISO week: week containing first Thursday of year
    // Thursday is day 4, so we go to nearest Thursday
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));

    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Get previous N weeks from a reference date.
 */
export function getPreviousWeeks(count: number, from?: Date): Array<{
    weekStart: Date;
    weekStartStr: string;
    weekLabel: string;
}> {
    const ref = from || new Date();
    const weeks: Array<{ weekStart: Date; weekStartStr: string; weekLabel: string }> = [];

    for (let i = 0; i < count; i++) {
        const d = new Date(ref);
        d.setUTCDate(d.getUTCDate() - (i * 7));
        weeks.push(getCanonicalWeek(d));
    }

    return weeks;
}

/**
 * Check if a date string is a valid week start (Monday).
 */
export function isValidWeekStart(dateStr: string): boolean {
    try {
        const date = new Date(dateStr + 'T00:00:00Z');
        return date.getUTCDay() === 1; // Monday
    } catch {
        return false;
    }
}

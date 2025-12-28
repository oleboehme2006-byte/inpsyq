/**
 * WEEK UTILITIES — ISO Week Date Handling
 * 
 * All week starts are Monday 00:00:00 UTC.
 * Week format: YYYY-MM-DD (ISO 8601)
 */

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get the Monday 00:00:00 UTC of the week containing the given date.
 */
export function getISOMondayUTC(date: Date): Date {
    const d = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ));

    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = d.getUTCDay();

    // Calculate days to subtract to get to Monday
    // Sunday (0) -> subtract 6
    // Monday (1) -> subtract 0
    // Tuesday (2) -> subtract 1
    // etc.
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    d.setUTCDate(d.getUTCDate() - daysToSubtract);
    d.setUTCHours(0, 0, 0, 0);

    return d;
}

/**
 * Get the ISO week start string (YYYY-MM-DD) for a given date.
 */
export function weekStartISO(date: Date): string {
    const monday = getISOMondayUTC(date);
    return formatDateISO(monday);
}

/**
 * Format a date as YYYY-MM-DD.
 */
export function formatDateISO(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to Date (UTC).
 */
export function parseDateISO(iso: string): Date {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

/**
 * List the last N week start strings, going backwards from a given week.
 * The given week is included as the first element.
 */
export function listWeeksBack(fromWeekStartISO: string, n: number): string[] {
    assertWeekStartISO(fromWeekStartISO);

    const weeks: string[] = [];
    const startDate = parseDateISO(fromWeekStartISO);

    for (let i = 0; i < n; i++) {
        const weekDate = new Date(startDate);
        weekDate.setUTCDate(weekDate.getUTCDate() - (i * 7));
        weeks.push(formatDateISO(weekDate));
    }

    return weeks;
}

/**
 * List weeks in chronological order (oldest first).
 */
export function listWeeksBackChronological(fromWeekStartISO: string, n: number): string[] {
    return listWeeksBack(fromWeekStartISO, n).reverse();
}

/**
 * Get the week N weeks before a given week.
 */
export function weeksBefore(fromWeekStartISO: string, n: number): string {
    assertWeekStartISO(fromWeekStartISO);
    const startDate = parseDateISO(fromWeekStartISO);
    startDate.setUTCDate(startDate.getUTCDate() - (n * 7));
    return formatDateISO(startDate);
}

/**
 * Get the week N weeks after a given week.
 */
export function weeksAfter(fromWeekStartISO: string, n: number): string {
    assertWeekStartISO(fromWeekStartISO);
    const startDate = parseDateISO(fromWeekStartISO);
    startDate.setUTCDate(startDate.getUTCDate() + (n * 7));
    return formatDateISO(startDate);
}

// ============================================================================
// Validation
// ============================================================================

const WEEK_START_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Assert that a string is a valid week start ISO format and is a Monday.
 */
export function assertWeekStartISO(value: string): void {
    if (typeof value !== 'string') {
        throw new Error(`WeekStartISO must be a string, got: ${typeof value}`);
    }

    if (!WEEK_START_REGEX.test(value)) {
        throw new Error(`WeekStartISO must be YYYY-MM-DD format, got: ${value}`);
    }

    const date = parseDateISO(value);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${value}`);
    }

    // Check it's a Monday
    const dayOfWeek = date.getUTCDay();
    if (dayOfWeek !== 1) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        throw new Error(`WeekStartISO must be a Monday, got: ${days[dayOfWeek]} (${value})`);
    }
}

/**
 * Check if a string is a valid week start ISO (without throwing).
 */
export function isValidWeekStartISO(value: string): boolean {
    try {
        assertWeekStartISO(value);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get the current week start.
 */
export function currentWeekStartISO(): string {
    return weekStartISO(new Date());
}

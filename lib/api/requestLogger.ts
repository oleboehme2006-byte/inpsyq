/**
 * API Request Logger
 * Structured logging for production observability.
 */

interface RequestLogEntry {
    request_id: string;
    route: string;
    method: string;
    duration_ms: number;
    status: number;
    user_id?: string;
    session_id?: string;
    llm_used?: boolean;
    item_count?: number;
    padded?: boolean;
    llm_error?: string;
    timestamp: string;
}

// In-memory ring buffer for recent requests (no DB schema changes)
const REQUEST_LOG_BUFFER: RequestLogEntry[] = [];
const MAX_BUFFER_SIZE = 100;

export const requestLogger = {
    log(entry: RequestLogEntry) {
        // Structured console log (JSON for production log aggregation)
        console.log(`[API] ${JSON.stringify(entry)}`);

        // Add to ring buffer
        REQUEST_LOG_BUFFER.push(entry);
        if (REQUEST_LOG_BUFFER.length > MAX_BUFFER_SIZE) {
            REQUEST_LOG_BUFFER.shift();
        }
    },

    getByRequestId(requestId: string): RequestLogEntry | null {
        return REQUEST_LOG_BUFFER.find(e => e.request_id === requestId) || null;
    },

    getRecent(limit: number = 10): RequestLogEntry[] {
        return REQUEST_LOG_BUFFER.slice(-limit);
    },

    createEntry(partial: Partial<RequestLogEntry> & { request_id: string; route: string }): RequestLogEntry {
        return {
            method: 'POST',
            duration_ms: 0,
            status: 200,
            timestamp: new Date().toISOString(),
            ...partial,
        };
    }
};

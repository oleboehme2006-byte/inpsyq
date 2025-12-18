
/**
 * Session Diagnostics Logger (DEV Only)
 * Provides structured, per-session logging for debugging.
 */

interface SessionDiagnostics {
    sessionId: string;
    userId: string;
    targetCount: number;
    events: DiagnosticEvent[];
}

interface DiagnosticEvent {
    timestamp: string;
    type: 'selection' | 'llm' | 'voice' | 'validation' | 'padding' | 'adaptive' | 'error';
    message: string;
    data?: Record<string, any>;
}

const sessions: Map<string, SessionDiagnostics> = new Map();

export const sessionLogger = {
    start(sessionId: string, userId: string, targetCount: number) {
        if (process.env.NODE_ENV === 'production') return;
        sessions.set(sessionId, {
            sessionId,
            userId,
            targetCount,
            events: []
        });
        this.log(sessionId, 'selection', `Session started`, { targetCount });
    },

    log(sessionId: string, type: DiagnosticEvent['type'], message: string, data?: Record<string, any>) {
        if (process.env.NODE_ENV === 'production') return;
        const session = sessions.get(sessionId);
        if (!session) return;

        session.events.push({
            timestamp: new Date().toISOString(),
            type,
            message,
            data
        });

        // Also console log for real-time visibility
        console.log(`[SessionDiag:${sessionId.slice(0, 8)}] [${type.toUpperCase()}] ${message}`, data || '');
    },

    logSelection(sessionId: string, mode: 'contextual' | 'llm' | 'legacy', count: number) {
        this.log(sessionId, 'selection', `${mode} selection returned ${count} items`, { mode, count });
    },

    logLlmUndergeneration(sessionId: string, expected: number, actual: number) {
        this.log(sessionId, 'llm', `LLM undergeneration: expected ${expected}, got ${actual}`, { expected, actual });
    },

    logVoiceRewrite(sessionId: string, rewriteCount: number) {
        this.log(sessionId, 'voice', `Voice layer rewrote ${rewriteCount} items`);
    },

    logValidationRejection(sessionId: string, reason: string, itemId?: string) {
        this.log(sessionId, 'validation', `Item rejected: ${reason}`, { itemId });
    },

    logPadding(sessionId: string, needed: number, added: number) {
        this.log(sessionId, 'padding', `Padding applied: needed ${needed}, added ${added}`, { needed, added });
    },

    logAdaptiveStop(sessionId: string, reason: 'stable' | 'low_gain' | 'redundancy' | 'none', adjusted?: number) {
        this.log(sessionId, 'adaptive', `Adaptive stop: ${reason}`, { reason, adjustedCount: adjusted });
    },

    getSummary(sessionId: string): SessionDiagnostics | null {
        if (process.env.NODE_ENV === 'production') return null;
        return sessions.get(sessionId) || null;
    },

    clear(sessionId: string) {
        sessions.delete(sessionId);
    }
};

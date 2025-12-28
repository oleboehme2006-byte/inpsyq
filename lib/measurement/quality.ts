/**
 * MEASUREMENT QUALITY — Quality Metrics Computation
 * 
 * Deterministic quality metrics for completed sessions.
 */

import { query } from '@/db/client';
import { getRequiredItems } from './itemRegistry';
import { getSession } from './session';
import { getSessionResponses } from './response';

// ============================================================================
// Types
// ============================================================================

export interface MeasurementQuality {
    sessionId: string;
    completionRate: number;
    responseTimeMs: number | null;
    missingItems: number;
    confidenceProxy: number;
}

// ============================================================================
// Quality Computation
// ============================================================================

/**
 * Compute and persist quality metrics for a session.
 */
export async function computeSessionQuality(sessionId: string): Promise<MeasurementQuality> {
    const session = await getSession(sessionId);
    if (!session) {
        throw new Error(`[Quality] Session "${sessionId}" not found`);
    }

    const responses = await getSessionResponses(sessionId);
    const requiredItems = getRequiredItems();

    // Completion rate
    const answeredIds = new Set(responses.map(r => r.itemId));
    const requiredAnswered = requiredItems.filter(i => answeredIds.has(i.itemId)).length;
    const completionRate = requiredItems.length > 0
        ? requiredAnswered / requiredItems.length
        : 0;

    // Missing items
    const missingItems = requiredItems.length - requiredAnswered;

    // Response time (if session completed)
    let responseTimeMs: number | null = null;
    if (session.startedAt && session.completedAt) {
        responseTimeMs = session.completedAt.getTime() - session.startedAt.getTime();
    }

    // Confidence proxy (deterministic based on completion and response time)
    const confidenceProxy = computeConfidenceProxy(completionRate, responseTimeMs);

    const quality: MeasurementQuality = {
        sessionId,
        completionRate,
        responseTimeMs,
        missingItems,
        confidenceProxy,
    };

    // Persist (upsert)
    await query(
        `INSERT INTO measurement_quality 
       (session_id, completion_rate, response_time_ms, missing_items, confidence_proxy)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (session_id)
     DO UPDATE SET
       completion_rate = $2,
       response_time_ms = $3,
       missing_items = $4,
       confidence_proxy = $5`,
        [sessionId, completionRate, responseTimeMs, missingItems, confidenceProxy]
    );

    return quality;
}

/**
 * Compute deterministic confidence proxy.
 * Higher completion + reasonable response time = higher confidence.
 */
function computeConfidenceProxy(completionRate: number, responseTimeMs: number | null): number {
    // Base confidence from completion
    let confidence = completionRate * 0.7;

    // Response time factor (not too fast, not too slow)
    if (responseTimeMs !== null) {
        const minutes = responseTimeMs / 60000;
        if (minutes >= 2 && minutes <= 15) {
            // Good range: add confidence
            confidence += 0.2;
        } else if (minutes < 1) {
            // Too fast: reduce confidence (might be random clicking)
            confidence *= 0.8;
        } else if (minutes > 30) {
            // Too slow: slight reduction (distraction)
            confidence *= 0.9;
        }
    }

    // Base confidence for participating
    confidence += 0.1;

    return Math.min(1, Math.max(0, confidence));
}

/**
 * Get quality metrics for a session.
 */
export async function getSessionQuality(sessionId: string): Promise<MeasurementQuality | null> {
    const result = await query(
        `SELECT * FROM measurement_quality WHERE session_id = $1`,
        [sessionId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
        sessionId: row.session_id,
        completionRate: parseFloat(row.completion_rate),
        responseTimeMs: row.response_time_ms ? parseInt(row.response_time_ms) : null,
        missingItems: parseInt(row.missing_items),
        confidenceProxy: parseFloat(row.confidence_proxy),
    };
}

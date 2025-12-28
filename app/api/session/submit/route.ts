import { NextResponse } from 'next/server';
import { query } from '@/db/client';
import { normalizationService } from '@/services/normalizationService';
import { inferenceEngine } from '@/services/inferenceService';
import { safeToFixed, safeNumber } from '@/lib/utils/safeNumber';
import { Parameter } from '@/lib/constants';
import { isValidUUID, generateRequestId, createValidationError } from '@/lib/api/validation';
import { requestLogger } from '@/lib/api/requestLogger';
import { requireSelfOrAdmin } from '@/lib/access/guards';

export const runtime = 'nodejs';

type ParamKey = Parameter;

export async function POST(req: Request) {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
        const body = await req.json();
        const { sessionId, responses, userId } = body;

        // Strict UUID Validation for sessionId
        if (!isValidUUID(sessionId)) {
            return NextResponse.json(
                createValidationError('sessionId', 'sessionId must be a valid UUID', requestId),
                { status: 400 }
            );
        }

        // Strict UUID Validation for userId
        if (!isValidUUID(userId)) {
            return NextResponse.json(
                createValidationError('userId', 'userId must be a valid UUID', requestId),
                { status: 400 }
            );
        }

        // Guard: User can only operate on their own data
        const guardResult = await requireSelfOrAdmin(req, userId);
        if (!guardResult.ok) {
            return guardResult.response;
        }

        // Validate responses array
        if (!responses || !Array.isArray(responses)) {
            return NextResponse.json(
                createValidationError('responses', 'responses must be a non-empty array', requestId),
                { status: 400 }
            );
        }

        // Process each response
        for (const r of responses) {
            const { interaction_id, raw_input } = r;

            // Validate interaction_id
            if (!isValidUUID(interaction_id)) {
                console.warn(`[Submit] Skipping invalid interaction_id: ${interaction_id}`);
                continue;
            }

            // 1. Store
            const resInsert = await query(`
            INSERT INTO responses (session_id, interaction_id, raw_input, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING response_id
        `, [sessionId, interaction_id, raw_input]);
            const responseId = resInsert.rows[0].response_id;

            // 2. Normalize / Encode
            const interactionRes = await query(`SELECT type, parameter_targets FROM interactions WHERE interaction_id = $1`, [interaction_id]);
            if (interactionRes.rows.length === 0) continue;

            const interaction = interactionRes.rows[0];
            const parameterTargets = interaction.parameter_targets as ParamKey[];

            const encoded = await normalizationService.normalizeResponse(raw_input, interaction.type, parameterTargets);

            // Cast encoded outputs
            const signals = encoded.signals as Record<ParamKey, number>;
            const uncertainty = encoded.uncertainty as Record<ParamKey, number>;

            // 3. Store Signals
            await query(`
             INSERT INTO encoded_signals (response_id, signals, uncertainty, confidence, flags, topics)
             VALUES ($1, $2, $3, $4, $5, $6)
        `, [responseId, encoded.signals, encoded.uncertainty, encoded.confidence, encoded.flags, encoded.topics]);

            // 4. Update Inference
            for (const t of parameterTargets) {
                const val = signals[t];
                const unc = uncertainty[t];

                if (val === undefined || val === null) continue;

                // Guard: Prevent Posterior Collapse
                const guardedConf = Math.max(0.1, safeNumber(encoded.confidence));
                const guardedUnc = Math.max(0.2, safeNumber(unc));
                const guardedVal = safeNumber(val);

                console.log(`[Submit] Inference Update: ${t} Val=${safeToFixed(guardedVal, 3)} Unc=${safeToFixed(guardedUnc, 3)} Conf=${safeToFixed(guardedConf, 2)}`);

                await inferenceEngine.updateState(
                    userId,
                    guardedVal,
                    guardedUnc,
                    t,
                    guardedConf,
                    encoded.flags.nonsense
                );
            }
        }

        // 5. Close Session
        await query(`UPDATE sessions SET completed_at = NOW() WHERE session_id = $1`, [sessionId]);

        const duration = Date.now() - startTime;

        // Log success
        requestLogger.log({
            request_id: requestId,
            route: '/api/session/submit',
            method: 'POST',
            duration_ms: duration,
            status: 200,
            user_id: userId,
            session_id: sessionId,
            item_count: responses.length,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            ok: true,
            request_id: requestId,
            duration_ms: duration,
            processed: responses.length,
        });

    } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error('[API] /session/submit Failed:', error.message, error.stack);

        requestLogger.log({
            request_id: requestId,
            route: '/api/session/submit',
            method: 'POST',
            duration_ms: duration,
            status: 500,
            llm_error: error.message,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            error: 'Internal Server Error',
            code: 'INTERNAL_ERROR',
            request_id: requestId,
        }, { status: 500 });
    }
}

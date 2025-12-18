import { NextResponse } from 'next/server';
import { query } from '@/db/client';
import { normalizationService } from '@/services/normalizationService';
import { inferenceEngine } from '@/services/inferenceService';
import { safeToFixed, safeNumber } from '@/lib/utils/safeNumber';
import { Parameter } from '@/lib/constants';

// Define valid parameter keys
type ParamKey = Parameter;

export async function POST(req: Request) {
    try {
        const { sessionId, responses, userId } = await req.json();

        if (!sessionId || !responses || !Array.isArray(responses)) {
            return NextResponse.json({ error: 'Invalid Input' }, { status: 400 });
        }

        // Process each response
        for (const r of responses) {
            const { interaction_id, raw_input } = r;

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
            const parameterTargets = interaction.parameter_targets as ParamKey[]; // STRICT CAST

            const encoded = await normalizationService.normalizeResponse(raw_input, interaction.type, parameterTargets);

            // Cast encoded outputs to record types
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

                // Skip if signal not produced for this target
                if (val === undefined || val === null) continue;

                // Guard: Prevent Posterior Collapse
                // Minimum uncertainty for single-item is ~0.2 (R=0.04). 
                const guardedConf = Math.max(0.1, safeNumber(encoded.confidence));
                const guardedUnc = Math.max(0.2, safeNumber(unc));
                const guardedVal = safeNumber(val);

                // Observability (Dev)
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

        return NextResponse.json({ ok: true });




    } catch (error: any) {
        console.error('[API] /session/submit Failed:', error.message, error.stack);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

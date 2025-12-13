import { NextResponse } from 'next/server';
import { query } from '@/db/client';
import { encoderService } from '@/services/encoderService';
import { inferenceEngine } from '@/services/inferenceService';

export async function POST(req: Request) {
    try {
        const { sessionId, responses, userId } = await req.json(); // Expecting list of responses now from full session? 
        // Or single response? Spec says: "submit... store responses... run inference... mark complete". 
        // Usually submit is for the whole session.

        // Spec input: { session_id, responses: [{ interaction_id, raw_input }] }

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

            // 2. Mock Encode
            // Need to get interaction type/targets for heuristics
            const interactionRes = await query(`SELECT type, parameter_targets FROM interactions WHERE interaction_id = $1`, [interaction_id]);
            if (interactionRes.rows.length === 0) continue;
            const interaction = interactionRes.rows[0];

            const encoded = await encoderService.encode(raw_input, interaction.type, interaction.parameter_targets);

            // 3. Store Signals
            await query(`
             INSERT INTO encoded_signals (response_id, signals, uncertainty, confidence, flags, topics)
             VALUES ($1, $2, $3, $4, $5, $6)
        `, [responseId, encoded.signals, encoded.uncertainty, encoded.confidence, encoded.flags, encoded.topics]);

            // 4. Update Inference
            const targets = interaction.parameter_targets;
            for (const t of targets) {
                const val = encoded.signals[t];
                const unc = encoded.uncertainty[t];

                await inferenceEngine.updateState(
                    userId,
                    val,
                    unc,
                    t,
                    encoded.confidence,
                    encoded.flags.nonsense
                );
            }
        }

        // 5. Close Session
        await query(`UPDATE sessions SET completed_at = NOW() WHERE session_id = $1`, [sessionId]);

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
